import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { nanoid } from 'nanoid';

const httpServer = createServer();
const io = new SocketServer(httpServer, {
  cors: {
    origin: '*', // In Production: Nur Ihre Domain erlauben
    methods: ['GET', 'POST'],
  },
});

const sessions = new Map();
const codeToSessionId = new Map();

// Hilfsfunktionen für Aufgaben-Generierung
function generiereAufgaben(settings) {
  const aufgaben = [];
  
  for (let i = 0; i < settings.anzahlAufgaben; i++) {
    const operation = settings.operationen[Math.floor(Math.random() * settings.operationen.length)];
    const aufgabe = generiereAufgabe(operation, settings, i);
    aufgaben.push(aufgabe);
  }
  
  return aufgaben;
}

function generiereAufgabe(operation, settings, index) {
  let zahl1, zahl2, ergebnis;
  
  const maxWert = Math.pow(10, settings.anzahlStellen) - 1;
  const minWert = settings.mitMinuswerten ? -maxWert : 0;
  
  switch (operation) {
    case 'addition':
      zahl1 = generiereZahl(minWert, maxWert, settings.mitKommastellen);
      zahl2 = generiereZahl(minWert, maxWert, settings.mitKommastellen);
      ergebnis = runde(zahl1 + zahl2);
      break;
      
    case 'subtraktion':
      zahl1 = generiereZahl(minWert, maxWert, settings.mitKommastellen);
      zahl2 = generiereZahl(minWert, maxWert, settings.mitKommastellen);
      ergebnis = runde(zahl1 - zahl2);
      break;
      
    case 'multiplikation':
      const reihe = settings.reihen[Math.floor(Math.random() * settings.reihen.length)];
      const faktor = Math.floor(Math.random() * 12) + 1;
      zahl1 = reihe;
      zahl2 = faktor;
      ergebnis = zahl1 * zahl2;
      break;
      
    case 'division':
      const reiheDiv = settings.reihen[Math.floor(Math.random() * settings.reihen.length)];
      const faktorDiv = Math.floor(Math.random() * 12) + 1;
      zahl1 = reiheDiv * faktorDiv;
      zahl2 = reiheDiv;
      ergebnis = faktorDiv;
      break;
  }
  
  return {
    id: nanoid(),
    operation,
    zahl1,
    zahl2,
    ergebnis,
    index,
  };
}

function generiereZahl(min, max, mitKommastellen) {
  let zahl = Math.floor(Math.random() * (max - min + 1)) + min;
  
  if (mitKommastellen && Math.random() > 0.5) {
    const kommastellen = Math.floor(Math.random() * 2) + 1;
    zahl = parseFloat((zahl + Math.random()).toFixed(kommastellen));
  }
  
  return zahl;
}

function runde(zahl) {
  return Math.round(zahl * 100) / 100;
}

function generiereSessionCode() {
  const digits = '0123456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return code;
}

io.on('connection', (socket) => {
  console.log('Client verbunden:', socket.id);

  socket.on('create-session', (settings) => {
    const sessionId = nanoid();
    const code = generiereSessionCode();
    
    const session = {
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

  socket.on('create-revanche-session', ({ oldSessionId, settings }) => {
    const oldSession = sessions.get(oldSessionId);
    if (!oldSession) return;

    const sessionId = nanoid();
    const code = generiereSessionCode();
    
    const session = {
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
    
    socket.emit('session-created', { sessionId, code, session });
    io.to(oldSessionId).emit('revanche-started', { code, session });
  });

  socket.on('join-session', ({ code, name }) => {
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
    
    const teilnehmer = {
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

  socket.on('start-session', (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) {
      console.log(`❌ Session nicht gefunden: ${sessionId}`);
      return;
    }
    
    // Stelle sicher, dass der Lehrer im Room ist
    socket.join(sessionId);
    console.log(`🚀 Lehrer startet Session: ${sessionId}, Socket ${socket.id} ist jetzt im Room`);
    
    session.status = 'countdown';
    io.to(sessionId).emit('session-countdown');
    
    setTimeout(() => {
      session.status = 'running';
      session.startzeit = Date.now();
      console.log(`▶️ Session gestartet: ${sessionId}`);
      io.to(sessionId).emit('session-started', { aufgaben: session.aufgaben });
    }, 10000);
  });

  socket.on('submit-antwort', ({ sessionId, aufgabeId, antwort, zeit }) => {
    const session = sessions.get(sessionId);
    if (!session) {
      console.log(`❌ Session nicht gefunden: ${sessionId}`);
      return;
    }
    
    const teilnehmer = session.teilnehmer.find(t => t.id === socket.id);
    if (!teilnehmer) {
      console.log(`❌ Teilnehmer nicht gefunden: ${socket.id}`);
      return;
    }
    
    const aufgabe = session.aufgaben.find(a => a.id === aufgabeId);
    if (!aufgabe) {
      console.log(`❌ Aufgabe nicht gefunden: ${aufgabeId}`);
      return;
    }
    
    const korrekt = Math.abs(antwort - aufgabe.ergebnis) < 0.01;
    
    console.log(`✅ Antwort von ${teilnehmer.name}: ${antwort}, Ergebnis: ${aufgabe.ergebnis}, Korrekt: ${korrekt}`);
    
    teilnehmer.antworten.push({
      aufgabeId,
      antwort,
      korrekt,
      zeit,
    });
    
    teilnehmer.gesamtZeit += zeit;
    teilnehmer.durchschnittsZeit = teilnehmer.gesamtZeit / teilnehmer.antworten.length;
    
    // Fortschritt loggen
    console.log(`📊 Fortschritt ${teilnehmer.name}: ${teilnehmer.antworten.length}/${session.aufgaben.length}`);
    
    // Sende Fortschritts-Update an alle (inkl. Lehrer)
    io.to(sessionId).emit('progress-update', { session });
    
    const alleFertig = session.teilnehmer.every(
      t => t.antworten.length === session.aufgaben.length
    );
    
    console.log(`🔍 Alle fertig? ${alleFertig} (${session.teilnehmer.map(t => `${t.name}: ${t.antworten.length}/${session.aufgaben.length}`).join(', ')})`);
    
    if (alleFertig) {
      session.status = 'finished';
      
      const rangliste = session.teilnehmer
        .map(t => ({
          id: t.id,
          name: t.name,
          punkte: t.antworten.filter(a => a.korrekt).length,
          gesamtZeit: t.gesamtZeit,
          durchschnittsZeit: t.durchschnittsZeit,
        }))
        .sort((a, b) => {
          if (b.punkte !== a.punkte) return b.punkte - a.punkte;
          return a.gesamtZeit - b.gesamtZeit;
        });
      
      console.log('🎉 Session beendet, sende Rangliste:', rangliste);
      io.to(sessionId).emit('session-finished', { rangliste });
    }
  });

  socket.on('abort-session', (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) {
      console.log(`❌ Session nicht gefunden für Abbruch: ${sessionId}`);
      return;
    }
    
    console.log(`⏹️ Session wird abgebrochen: ${sessionId}`);
    session.status = 'finished';
    
    // Erstelle Rangliste mit aktuellen Ergebnissen
    const rangliste = session.teilnehmer
      .map(t => ({
        id: t.id,
        name: t.name,
        punkte: t.antworten.filter(a => a.korrekt).length,
        gesamtZeit: t.gesamtZeit,
        durchschnittsZeit: t.durchschnittsZeit,
      }))
      .sort((a, b) => {
        if (b.punkte !== a.punkte) return b.punkte - a.punkte;
        return a.gesamtZeit - b.gesamtZeit;
      });
    
    console.log('🎉 Session abgebrochen, sende Rangliste:', rangliste);
    io.to(sessionId).emit('session-finished', { rangliste });
  });

  socket.on('disconnect', () => {
    console.log('Client getrennt:', socket.id);
    
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
  console.log(`🚀 Socket.io Server läuft auf Port ${PORT}`);
});

