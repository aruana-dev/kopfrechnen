import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { nanoid } from 'nanoid';
import { Session, Teilnehmer, SessionSettings } from './types';
import { generiereAufgaben } from './lib/aufgaben-generator';
import { generiereSessionCode } from './lib/session-code';

const httpServer = createServer();
const io = new SocketServer(httpServer, {
  cors: {
    origin: '*',
  },
});

const sessions = new Map<string, Session>();
const codeToSessionId = new Map<string, string>();

io.on('connection', (socket) => {
  console.log('Client verbunden:', socket.id);

  socket.on('create-session', (settings: SessionSettings) => {
    const sessionId = nanoid();
    const code = generiereSessionCode();
    
    const session: Session = {
      id: sessionId,
      code,
      settings,
      aufgaben: generiereAufgaben(settings),
      teilnehmer: [],
      status: 'lobby',
    };
    
    sessions.set(sessionId, session);
    codeToSessionId.set(code, sessionId);
    
    socket.join(sessionId);
    console.log(`Session erstellt: ${sessionId}, Code: ${code}, Socket: ${socket.id}`);
    socket.emit('session-created', { sessionId, code, session });
  });

  socket.on('create-revanche-session', ({ oldSessionId, settings }: { oldSessionId: string; settings: SessionSettings }) => {
    const oldSession = sessions.get(oldSessionId);
    if (!oldSession) return;

    const sessionId = nanoid();
    const code = generiereSessionCode();
    
    const session: Session = {
      id: sessionId,
      code,
      settings,
      aufgaben: generiereAufgaben(settings),
      teilnehmer: [],
      status: 'lobby',
    };
    
    sessions.set(sessionId, session);
    codeToSessionId.set(code, sessionId);
    
    socket.join(sessionId);
    console.log(`Revanche-Session erstellt: ${sessionId}, Code: ${code}`);
    
    // Lehrer bekommt normale Session-Created
    socket.emit('session-created', { sessionId, code, session });
    
    // Alle Schüler der alten Session bekommen Revanche-Event
    io.to(oldSessionId).emit('revanche-started', { code, session });
  });

  socket.on('join-session', ({ code, name }: { code: string; name: string }) => {
    console.log(`Join-Versuch: Code=${code}, Name=${name}, Socket=${socket.id}`);
    const sessionId = codeToSessionId.get(code);
    
    if (!sessionId) {
      console.log(`Session nicht gefunden für Code: ${code}`);
      socket.emit('error', { message: 'Session nicht gefunden' });
      return;
    }
    
    const session = sessions.get(sessionId);
    if (!session) {
      console.log(`Session nicht gefunden für ID: ${sessionId}`);
      socket.emit('error', { message: 'Session nicht gefunden' });
      return;
    }
    
    if (session.status !== 'lobby') {
      console.log(`Session bereits gestartet: ${sessionId}`);
      socket.emit('error', { message: 'Session bereits gestartet' });
      return;
    }
    
    const teilnehmer: Teilnehmer = {
      id: socket.id,
      name,
      antworten: [],
      gesamtZeit: 0,
      durchschnittsZeit: 0,
    };
    
    session.teilnehmer.push(teilnehmer);
    socket.join(sessionId);
    
    console.log(`Teilnehmer beigetreten: ${name} zu Session ${sessionId}`);
    console.log(`Sende Event an Room: ${sessionId}, Mitglieder: ${session.teilnehmer.length}`);
    
    io.to(sessionId).emit('teilnehmer-joined', { teilnehmer, session });
    console.log(`Event gesendet an ${io.sockets.adapter.rooms.get(sessionId)?.size || 0} Clients im Room`);
  });

  socket.on('start-session', (sessionId: string) => {
    const session = sessions.get(sessionId);
    if (!session) return;
    
    session.status = 'countdown';
    io.to(sessionId).emit('session-countdown');
    
    setTimeout(() => {
      session.status = 'running';
      session.startzeit = Date.now();
      io.to(sessionId).emit('session-started', { aufgaben: session.aufgaben });
    }, 10000); // 10 Sekunden Countdown
  });

  socket.on('submit-antwort', ({ sessionId, aufgabeId, antwort, zeit }: { 
    sessionId: string; 
    aufgabeId: string; 
    antwort: number; 
    zeit: number;
  }) => {
    const session = sessions.get(sessionId);
    if (!session) return;
    
    const teilnehmer = session.teilnehmer.find(t => t.id === socket.id);
    if (!teilnehmer) return;
    
    const aufgabe = session.aufgaben.find(a => a.id === aufgabeId);
    if (!aufgabe) return;
    
    const korrekt = Math.abs(antwort - aufgabe.ergebnis) < 0.01; // Toleranz für Rundungsfehler
    
    console.log(`Antwort: ${antwort}, Ergebnis: ${aufgabe.ergebnis}, Korrekt: ${korrekt}`);
    
    teilnehmer.antworten.push({
      aufgabeId,
      antwort,
      korrekt,
      zeit,
    });
    
    teilnehmer.gesamtZeit += zeit;
    teilnehmer.durchschnittsZeit = teilnehmer.gesamtZeit / teilnehmer.antworten.length;
    
    // Prüfen ob alle fertig sind
    const alleFertig = session.teilnehmer.every(
      t => t.antworten.length === session.aufgaben.length
    );
    
    if (alleFertig) {
      session.status = 'finished';
      
      // Rangliste erstellen - bei gleicher Punktzahl zählt die Gesamtzeit!
      const rangliste = session.teilnehmer
        .map(t => ({
          id: t.id,
          name: t.name,
          punkte: t.antworten.filter(a => a.korrekt).length,
          gesamtZeit: t.gesamtZeit,
          durchschnittsZeit: t.durchschnittsZeit,
        }))
        .sort((a, b) => {
          // Zuerst nach Punkten
          if (b.punkte !== a.punkte) return b.punkte - a.punkte;
          // Bei gleicher Punktzahl: kürzere Gesamtzeit gewinnt
          return a.gesamtZeit - b.gesamtZeit;
        });
      
      console.log('Session beendet, sende Rangliste:', rangliste);
      io.to(sessionId).emit('session-finished', { rangliste });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client getrennt:', socket.id);
    
    // Teilnehmer aus allen Sessions entfernen
    sessions.forEach((session, sessionId) => {
      const index = session.teilnehmer.findIndex(t => t.id === socket.id);
      if (index !== -1) {
        session.teilnehmer.splice(index, 1);
        io.to(sessionId).emit('teilnehmer-left', { teilnehmerId: socket.id, session });
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io Server läuft auf Port ${PORT}`);
});

