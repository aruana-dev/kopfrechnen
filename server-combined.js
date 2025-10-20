/**
 * Combined Server für Railway Production
 * Startet Next.js App und Socket.io Server zusammen in einem Prozess
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Next.js App initialisieren
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Async Startup für ESM Module
(async () => {
  // Dynamisches Import für nanoid (ESM)
  const { nanoid } = await import('nanoid');
  console.log('✅ nanoid geladen');

  await app.prepare();
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Socket.io Server initialisieren
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  console.log('🔌 Socket.io Server initialisiert');

  // Aktive Sessions speichern
  const sessions = new Map();

  // Socket.io Event Handlers
  io.on('connection', (socket) => {
    console.log('✅ Client verbunden:', socket.id);

    socket.on('create-session', ({ settings, teacherName }) => {
      const sessionId = nanoid(10);
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const session = {
        id: sessionId,
        code,
        settings,
        teacherName: teacherName || 'Lehrkraft',
        teilnehmer: [],
        status: 'lobby',
        createdAt: Date.now()
      };
      
      sessions.set(sessionId, session);
      socket.join(sessionId);
      
      console.log('📝 Session erstellt:', sessionId, 'Code:', code);
      socket.emit('session-created', { sessionId, code });
    });

    socket.on('join-session', ({ code, nickname }) => {
      let session = null;
      let sessionId = null;
      
      for (const [id, s] of sessions.entries()) {
        if (s.code === code) {
          session = s;
          sessionId = id;
          break;
        }
      }
      
      if (!session) {
        socket.emit('error', { message: 'Session nicht gefunden' });
        return;
      }
      
      const teilnehmer = {
        id: socket.id,
        nickname,
        punkte: 0,
        fertig: false
      };
      
      session.teilnehmer.push(teilnehmer);
      socket.join(sessionId);
      
      socket.emit('session-joined', { sessionId, session });
      io.to(sessionId).emit('teilnehmer-joined', { teilnehmer, session });
      
      console.log('👤 Teilnehmer beigetreten:', nickname, 'zu Session:', sessionId);
    });

    socket.on('start-session', ({ sessionId }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      
      session.status = 'active';
      socket.join(sessionId);
      io.to(sessionId).emit('session-started', { session });
      
      console.log('🚀 Session gestartet:', sessionId);
    });

    socket.on('submit-antwort', ({ sessionId, antwort }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      
      const teilnehmer = session.teilnehmer.find(t => t.id === socket.id);
      if (teilnehmer) {
        teilnehmer.punkte = antwort.punkte;
        teilnehmer.fertig = antwort.fertig;
      }
      
      io.to(sessionId).emit('progress-update', { session });
      
      const alleFertig = session.teilnehmer.every(t => t.fertig);
      if (alleFertig) {
        session.status = 'finished';
        const ranking = session.teilnehmer
          .sort((a, b) => b.punkte - a.punkte)
          .map((t, index) => ({ ...t, rang: index + 1 }));
        
        io.to(sessionId).emit('session-finished', { ranking });
        console.log('🏁 Session beendet:', sessionId);
      }
    });

    socket.on('abort-session', ({ sessionId }) => {
      const session = sessions.get(sessionId);
      if (!session) return;
      
      session.status = 'finished';
      const ranking = session.teilnehmer
        .sort((a, b) => b.punkte - a.punkte)
        .map((t, index) => ({ ...t, rang: index + 1 }));
      
      io.to(sessionId).emit('session-finished', { ranking });
      console.log('⏹️ Session abgebrochen:', sessionId);
    });

    socket.on('disconnect', () => {
      console.log('❌ Client getrennt:', socket.id);
    });
  });

  // Server starten
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚂 Railway Combined Server gestartet!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📦 Next.js App:     http://${hostname}:${port}`);
    console.log(`🔌 Socket.io:       http://${hostname}:${port}/socket.io`);
    console.log(`🌐 Environment:     ${process.env.NODE_ENV || 'development'}`);
    console.log('═══════════════════════════════════════════════════════');
  });
})().catch(err => {
  console.error('❌ Server Startup Fehler:', err);
  process.exit(1);
});

