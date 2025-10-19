'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/useSessionStore';
import { useSocket } from '@/hooks/useSocket';
import { useSound } from '@/hooks/useSound';

export default function Results() {
  const router = useRouter();
  const { stats, previousStats, role, reset, setPreviousStats, resetForRevanche, session } = useSessionStore();
  const { socket } = useSocket();
  const { playSound } = useSound(role === 'teacher');

  // Sounds abspielen wenn Ergebnisse angezeigt werden
  useEffect(() => {
    if (role === 'teacher' && stats) {
      // Applaus für alle
      playSound('applause.mp3');
      
      // Nach 1 Sekunde: Winner Sound für Platz 1
      setTimeout(() => {
        playSound('winner.mp3');
      }, 1000);
      
      // Nach 2 Sekunden: Celebration
      setTimeout(() => {
        playSound('celebration.mp3');
      }, 2000);
    }
  }, [role, stats]);

  const handleBackToHome = () => {
    reset();
    router.push('/');
  };

  const handleRevanche = () => {
    if (!socket || !session) return;
    
    // Aktuelle Stats als previousStats speichern
    if (stats) {
      setPreviousStats(stats);
    }
    
    // Für Revanche zurücksetzen
    resetForRevanche();
    
    // Lehrer erstellt neue Session mit gleichen Einstellungen
    if (role === 'teacher') {
      socket.emit('create-revanche-session', { 
        oldSessionId: session.id,
        settings: session.settings 
      });
      
      socket.once('session-created', ({ sessionId, code, session: newSession }) => {
        console.log('Revanche-Session erstellt:', sessionId, code, newSession);
        // Session SOFORT setzen, bevor zur Lobby navigiert wird
        useSessionStore.getState().setSession(newSession);
        useSessionStore.getState().setRole('teacher');
        // Kurz warten, damit State aktualisiert wird
        setTimeout(() => {
          router.push(`/teacher/lobby?code=${code}`);
        }, 100);
      });
    }
  };

  // Schüler: Auf Revanche-Event reagieren
  useEffect(() => {
    if (!socket || role !== 'student' || !stats) return;

    const handleRevanche = ({ code, session: newSession }: any) => {
      console.log('Schüler: Revanche gestartet, neuer Code:', code, newSession);
      
      // Finde meinen Namen aus der letzten Session
      const meinName = stats.teilnehmer[0]?.name || 'Spieler';
      
      console.log('Schüler: Trete automatisch bei als:', meinName);
      
      // Speichere vorherige Stats
      if (stats) {
        setPreviousStats(stats);
      }
      resetForRevanche();
      
      // Automatisch der neuen Session beitreten!
      socket.emit('join-session', { code, name: meinName });
      
      socket.once('teilnehmer-joined', ({ session: joinedSession }: any) => {
        console.log('Schüler: Erfolgreich Revanche-Session beigetreten', joinedSession);
        // Session SOFORT setzen, bevor zur Lobby navigiert wird
        useSessionStore.getState().setSession(joinedSession);
        useSessionStore.getState().setRole('student');
        // Kurz warten, damit State aktualisiert wird
        setTimeout(() => {
          router.push('/student/lobby');
        }, 100);
      });
    };

    socket.on('revanche-started', handleRevanche);

    return () => {
      socket.off('revanche-started', handleRevanche);
    };
  }, [socket, role, router, stats]);

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt Ergebnisse...</p>
      </div>
    );
  }

  // Platzvergleich berechnen, wenn previousStats vorhanden
  const teilnehmerMitVergleich = stats.teilnehmer.map((teilnehmer, currentIndex) => {
    if (previousStats) {
      const prevIndex = previousStats.teilnehmer.findIndex(t => t.name === teilnehmer.name);
      if (prevIndex !== -1) {
        const platzVeraenderung = prevIndex - currentIndex;
        const zeitVerbesserung = previousStats.teilnehmer[prevIndex].gesamtZeit - teilnehmer.gesamtZeit;
        return { ...teilnehmer, platzVeraenderung, zeitVerbesserung };
      }
    }
    return teilnehmer;
  });

  // Ranglisten-Filter anwenden
  const ranglisteLimit = session?.settings.ranglisteAnzeige || 0;
  const anzuzeigende = ranglisteLimit === 0 ? teilnehmerMitVergleich : teilnehmerMitVergleich.slice(0, ranglisteLimit);

  const getMedal = (position: number) => {
    if (position === 0) return '🥇';
    if (position === 1) return '🥈';
    if (position === 2) return '🥉';
    return `#${position + 1}`;
  };

  const getColor = (position: number) => {
    if (position === 0) return 'from-yellow-400 to-yellow-600';
    if (position === 1) return 'from-gray-300 to-gray-500';
    if (position === 2) return 'from-orange-400 to-orange-600';
    return 'from-kahoot-blue to-kahoot-purple';
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl md:text-7xl font-bold text-center mb-12"
        >
          {stats.teilnehmer.length === 1 && stats.teilnehmer[0].id === 'self' 
            ? '🎯 Dein Ergebnis' 
            : '🏆 Ergebnisse'
          }
        </motion.h1>

        {ranglisteLimit > 0 && ranglisteLimit < stats.teilnehmer.length && (
          <p className="text-center text-xl opacity-80 mb-4">
            Zeige Top {ranglisteLimit} von {stats.teilnehmer.length} Teilnehmern
          </p>
        )}

        <div className="space-y-4">
          {anzuzeigende.map((teilnehmer, index) => (
            <motion.div
              key={teilnehmer.id}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-r ${getColor(index)} p-6 rounded-2xl shadow-2xl`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{getMedal(index)}</div>
                  <div>
                    <h2 className="text-2xl font-bold">{teilnehmer.name}</h2>
                    <p className="text-lg opacity-90">
                      {teilnehmer.punkte} Punkte
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm opacity-80">Ø Zeit pro Aufgabe</p>
                  <p className="text-2xl font-bold">
                    {(teilnehmer.durchschnittsZeit / 1000).toFixed(1)}s
                  </p>
                  <p className="text-sm opacity-80 mt-1">
                    Gesamt: {(teilnehmer.gesamtZeit / 1000).toFixed(1)}s
                  </p>
                  
                  {/* Platzveränderung anzeigen */}
                  {teilnehmer.platzVeraenderung !== undefined && teilnehmer.platzVeraenderung !== 0 && (
                    <p className={`text-lg font-bold mt-2 ${teilnehmer.platzVeraenderung > 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {teilnehmer.platzVeraenderung > 0 ? '↑' : '↓'} {Math.abs(teilnehmer.platzVeraenderung)} Plätze
                    </p>
                  )}
                  
                  {/* Zeitverbesserung anzeigen */}
                  {teilnehmer.zeitVerbesserung !== undefined && (
                    <p className={`text-sm mt-1 ${teilnehmer.zeitVerbesserung > 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {teilnehmer.zeitVerbesserung > 0 ? '⚡ -' : '🐌 +'}{Math.abs(teilnehmer.zeitVerbesserung / 1000).toFixed(1)}s
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Zurück-Buttons */}
        {role === 'student' && stats.teilnehmer.length === 1 && stats.teilnehmer[0].id === 'self' ? (
          // Solo-Modus: Zurück zum Schüler-Dashboard
          <div className="space-y-4 mt-12">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                reset();
                router.push('/student/dashboard');
              }}
              className="kahoot-button bg-kahoot-blue w-full"
            >
              📊 Zurück zum Dashboard
            </motion.button>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                reset();
                router.push('/student/learn');
              }}
              className="kahoot-button bg-kahoot-green w-full"
            >
              🔄 Nochmal üben
            </motion.button>
          </div>
        ) : (
          // Multi-Player oder Lehrer: Zurück zur Startseite
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBackToHome}
            className="kahoot-button bg-kahoot-purple w-full mt-12"
          >
            🏠 Zurück zur Startseite
          </motion.button>
        )}

        {role === 'teacher' && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRevanche}
              className="kahoot-button bg-kahoot-orange w-full mt-4"
            >
              🔄 Revanche (gleiche Einstellungen)
            </motion.button>
            
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                reset();
                router.push('/teacher');
              }}
              className="kahoot-button bg-kahoot-green w-full mt-4"
            >
              ➕ Neue Session erstellen
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
