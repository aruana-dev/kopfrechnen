'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useSessionStore } from '@/store/useSessionStore';

export default function TeacherSession() {
  const router = useRouter();
  const { socket } = useSocket();
  const { session, stats, setStats } = useSessionStore();

  useEffect(() => {
    if (!socket) return;

    socket.on('session-finished', ({ rangliste }) => {
      setStats({ teilnehmer: rangliste });
      router.push('/results');
    });

    return () => {
      socket.off('session-finished');
    };
  }, [socket, router, setStats]);

  const handleAbort = () => {
    if (!socket || !session) return;
    
    if (confirm('Quiz wirklich abbrechen? Die Rangliste wird mit den aktuellen Ergebnissen erstellt.')) {
      socket.emit('abort-session', session.id);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-8">
            📊 Quiz läuft...
          </h1>

          <div className="kahoot-card mb-8">
            <h2 className="text-2xl font-bold mb-6">Teilnehmer-Fortschritt</h2>
            
            <div className="space-y-4">
              {session.teilnehmer.map((teilnehmer) => {
                const progress = (teilnehmer.antworten.length / session.aufgaben.length) * 100;
                const korrekteAntworten = teilnehmer.antworten.filter(a => a.korrekt).length;
                
                return (
                  <div key={teilnehmer.id} className="bg-white/10 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{teilnehmer.name}</span>
                      <span className="text-sm">
                        {teilnehmer.antworten.length} / {session.aufgaben.length} 
                        {teilnehmer.antworten.length > 0 && 
                          ` (${korrekteAntworten} richtig)`
                        }
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-kahoot-green to-kahoot-blue"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-8"
          >
            ⏳
          </motion.div>

          {/* Abbrechen-Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAbort}
            className="kahoot-button bg-kahoot-red"
          >
            ⏹️ Quiz abbrechen
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
