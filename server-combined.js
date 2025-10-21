/**
 * Combined Server für Railway - Next.js + Socket.io
 * 
 * Problem: server/index.js hat eigene Event-Handler, die wir nutzen wollen
 * Lösung: Importiere Socket-Handler Logik direkt
 */

const http = require('http');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Next.js App vorbereiten
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

(async () => {
  // Lade nanoid (ESM)
  const { nanoid } = await import('nanoid');
  console.log('✅ nanoid geladen');

  await app.prepare();
  console.log('✅ Next.js vorbereitet');

  // HTTP Server erstellen
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  // Socket.io anhängen
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    path: '/socket.io'
  });

  console.log('🔌 Socket.io an HTTP Server angehängt');

  // Socket.io Handler (aus server/index.js)
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

    return { id: nanoid(), operation, zahl1, zahl2, ergebnis, index };
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
    const digits = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
  }

  // Socket.io Event Handlers (aus server/index.js kopiert)
  io.on('connection', (socket) => {
    console.log('✅ Client verbunden:', socket.id);

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
      console.log(`📝 Session erstellt: ${sessionId}, Code: ${code}`);
      socket.emit('session-created', { sessionId, code, session });
    });

    socket.on('get-session-by-code', ({ code }) => {
      console.log(`🔍 Get-Session-Versuch: Code=${code}`);
      const sessionId = codeToSessionId.get(code);
      
      if (!sessionId) {
        console.log(`❌ Session nicht gefunden für Code: ${code}`);
        socket.emit('error', { message: 'Session nicht gefunden' });
        return;
      }
      
      const session = sessions.get(sessionId);
      if (!session) {
        console.log(`❌ Session nicht gefunden für ID: ${sessionId}`);
        socket.emit('error', { message: 'Session nicht gefunden' });
        return;
      }
      
      socket.join(sessionId);
      console.log(`✅ Session geladen: ${sessionId}`);
      socket.emit('session-loaded', { session });
    });

    socket.on('join-session', ({ code, name }) => {
      console.log(`👤 Join-Versuch: Code=${code}, Name=${name}`);
      const sessionId = codeToSessionId.get(code);
      
      if (!sessionId) {
        socket.emit('error', { message: 'Session nicht gefunden' });
        return;
      }
      
      const session = sessions.get(sessionId);
      if (!session || session.status !== 'lobby') {
        socket.emit('error', { message: 'Session nicht verfügbar' });
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
      
      console.log(`✅ Teilnehmer beigetreten: ${name}`);
      io.to(sessionId).emit('teilnehmer-joined', { teilnehmer, session });
    });

    socket.on('start-session', ({ sessionId }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      
      session.status = 'running';
      socket.join(sessionId);
      
      console.log(`🚀 Session gestartet: ${sessionId}`);
      io.to(sessionId).emit('session-countdown');
      
      setTimeout(() => {
        io.to(sessionId).emit('session-started', { aufgaben: session.aufgaben });
      }, 10000);
    });

    socket.on('submit-antwort', ({ sessionId, aufgabeId, antwort, zeit }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      
      const teilnehmer = session.teilnehmer.find(t => t.id === socket.id);
      if (!teilnehmer) return;
      
      const aufgabe = session.aufgaben.find(a => a.id === aufgabeId);
      const korrekt = aufgabe && Math.abs(antwort - aufgabe.ergebnis) < 0.01;
      
      teilnehmer.antworten.push({ aufgabeId, antwort, korrekt, zeit });
      teilnehmer.gesamtZeit += zeit;
      teilnehmer.durchschnittsZeit = teilnehmer.gesamtZeit / teilnehmer.antworten.length;
      
      io.to(sessionId).emit('progress-update', { session });
      
      const alleFertig = session.teilnehmer.every(
        t => t.antworten.length === session.aufgaben.length
      );
      
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
          .sort((a, b) => b.punkte !== a.punkte ? b.punkte - a.punkte : a.gesamtZeit - b.gesamtZeit);
        
        console.log('🏁 Session beendet');
        io.to(sessionId).emit('session-finished', { rangliste, sessionId: session.id, aufgaben: session.aufgaben, settings: session.settings });
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Client getrennt:', socket.id);
    });
  });

  // Server starten
  server.listen(port, () => {
    console.log(`✅ Server läuft auf http://${hostname}:${port}`);
  });

})().catch(err => {
  console.error('❌ Fehler beim Start:', err);
  process.exit(1);
});
