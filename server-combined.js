/**
 * Combined Server - Patcht Next.js Standalone um Socket.io hinzuzufügen
 * 
 * Strategie: Wir patchen den 'http' module um den Server abzufangen
 * und Socket.io anzuhängen bevor Next.js ihn startet.
 */

const Module = require('module');
const originalRequire = Module.prototype.require;
const { Server: SocketIOServer } = require('socket.io');
let nanoid = null;

// Async setup für nanoid
(async () => {
  const mod = await import('nanoid');
  nanoid = mod.nanoid;
  console.log('✅ nanoid geladen');
  
  // Patch http.createServer um Socket.io anzuhängen
  Module.prototype.require = function(id) {
    const module = originalRequire.apply(this, arguments);
    
    if (id === 'http' || id === 'node:http') {
      const originalCreateServer = module.createServer;
      
      module.createServer = function(...args) {
        const server = originalCreateServer.apply(this, args);
        
        // Attach Socket.io zum Server
        const io = new SocketIOServer(server, {
          cors: {
            origin: '*',
            methods: ['GET', 'POST']
          },
          transports: ['websocket', 'polling'],
          path: '/socket.io'
        });

        console.log('🔌 Socket.io an HTTP Server angehängt');

        // Aktive Sessions
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
            console.log('📨 start-session Event empfangen:', sessionId, 'von Socket:', socket.id);
            const session = sessions.get(sessionId);
            if (!session) {
              console.log('❌ Session nicht gefunden:', sessionId);
              return;
            }
            
            session.status = 'active';
            socket.join(sessionId);
            console.log('👥 Socket joined Room:', sessionId, '- Sende session-started an Room');
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

        return server;
      };
    }
    
    return module;
  };

  // Jetzt starte den originalen Next.js Standalone Server
  console.log('⏳ Lade Next.js Standalone Server...');
  require('./.next/standalone/server.js');
  
})().catch(err => {
  console.error('❌ Fehler beim Setup:', err);
  process.exit(1);
});
