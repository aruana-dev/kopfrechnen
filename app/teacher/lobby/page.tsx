'use client';

import { Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { sessionAPI } from '@/hooks/usePolling';
import { useSessionStore } from '@/store/useSessionStore';
import { useSound } from '@/hooks/useSound';

function TeacherLobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const { session, setSession } = useSessionStore();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [previousTeilnehmerCount, setPreviousTeilnehmerCount] = useState(0);
  const [previousStatus, setPreviousStatus] = useState<string>('');
  const { playSound, playBackgroundMusic, stopBackgroundMusic, isMuted, toggleMute } = useSound(true);

  // Hintergrundmusik starten
  useEffect(() => {
    playBackgroundMusic();
    playSound('waiting.mp3');
    
    return () => {
      stopBackgroundMusic();
    };
  }, []);

  // Lade Session per Code, falls nicht im Store
  useEffect(() => {
    const loadSession = async () => {
      if (!code) {
        console.log('⚠️ Kein Code in URL - redirect zu /teacher');
        router.push('/teacher');
        return;
      }
      
      if (!session) {
        console.log('📡 Session nicht im Store, lade per Code:', code);
        const loadedSession = await sessionAPI.getSessionByCode(code);
        
        if (loadedSession) {
          console.log('✅ Session erfolgreich geladen:', loadedSession);
          setSession(loadedSession);
        } else {
          console.error('❌ Session nicht gefunden');
          alert('Session nicht gefunden!');
          router.push('/teacher');
        }
      } else {
        console.log('✅ Session bereits im Store vorhanden');
      }
    };

    loadSession();
  }, [code, session, setSession, router]);

  // Polling: Überwache Session-Status
  useEffect(() => {
    if (!session) return;

    const pollInterval = setInterval(async () => {
      const updatedSession = await sessionAPI.getSessionByCode(code!);
      
      if (updatedSession) {
        // Prüfe auf neue Teilnehmer
        if (updatedSession.teilnehmer.length > previousTeilnehmerCount) {
          playSound('join.mp3');
          setPreviousTeilnehmerCount(updatedSession.teilnehmer.length);
        }

        // Prüfe auf Status-Änderung
        if (updatedSession.status !== previousStatus) {
          setPreviousStatus(updatedSession.status);
          
          if (updatedSession.status === 'countdown') {
            console.log('📢 Countdown gestartet');
            setCountdown(3);
            stopBackgroundMusic();
            playSound('countdown.mp3');
          } else if (updatedSession.status === 'running') {
            console.log('🚀 Session gestartet');
            playSound('start.mp3');
            setTimeout(() => {
              router.push('/teacher/session');
            }, 500);
          }
        }

        setSession(updatedSession);
      }
    }, 2000); // Poll alle 2 Sekunden

    return () => clearInterval(pollInterval);
  }, [session, code, previousTeilnehmerCount, previousStatus, playSound, stopBackgroundMusic, router, setSession]);

  // Countdown Timer
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleStart = async () => {
    if (!session) return;
    console.log('🚀 Lehrer startet Session:', session.id);
    await sessionAPI.startSession(session.id);
  };

  if (!session || !code) {
    return (
      <div data-role="teacher" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-2xl mb-4">Lädt Session...</p>
          <p className="text-sm opacity-70">Code: {code || 'Fehlt'}</p>
        </div>
      </div>
    );
  }

  return (
    <div data-role="teacher" className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Sound Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleMute}
          className="fixed top-4 right-4 z-50 bg-white/20 p-3 rounded-full text-3xl"
        >
          {isMuted ? '🔇' : '🔊'}
        </motion.button>

        {/* Session Code */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl mb-4">Session-Code:</h2>
          <motion.div
            className="inline-block bg-white text-kahoot-purple px-12 py-6 rounded-2xl"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <p className="text-6xl md:text-8xl font-bold tracking-wider">{code}</p>
          </motion.div>
        </motion.div>

        {/* Countdown */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            >
              <motion.div
                key={countdown}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="text-9xl font-bold"
              >
                {countdown > 0 ? countdown : '🚀'}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Teilnehmer */}
        <div className="kahoot-card mb-8">
          <h2 className="text-3xl font-bold mb-6">
            Teilnehmer ({session.teilnehmer.length})
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {session.teilnehmer.map((teilnehmer: any, index: number) => (
                <motion.div
                  key={teilnehmer.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-kahoot-blue to-kahoot-purple p-4 rounded-xl text-center"
                >
                  <div className="text-4xl mb-2">👤</div>
                  <p className="font-semibold truncate">{teilnehmer.name}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {session.teilnehmer.length === 0 && (
            <motion.p
              className="text-center text-white/60 py-12"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Warte auf Teilnehmer...
            </motion.p>
          )}
        </div>

        {/* Start Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          disabled={session.teilnehmer.length === 0 || countdown !== null}
          className="kahoot-button bg-kahoot-green w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {session.teilnehmer.length === 0
            ? '⏳ Warte auf Teilnehmer'
            : '🚀 Quiz starten'}
        </motion.button>
      </div>
    </div>
  );
}

export default function TeacherLobby() {
  return (
    <Suspense fallback={
      <div data-role="teacher" className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    }>
      <TeacherLobbyContent />
    </Suspense>
  );
}
