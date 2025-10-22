'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { sessionAPI } from '@/hooks/usePolling';
import { useSessionStore } from '@/store/useSessionStore';
import { useSound } from '@/hooks/useSound';

export default function StudentLobby() {
  const router = useRouter();
  const { session, setSession, setStartzeit } = useSessionStore();
  const [countdown, setCountdown] = useState<number | null>(null);
  const { playSound, playBackgroundMusic, stopBackgroundMusic } = useSound(true, 'student');

  useEffect(() => {
    playBackgroundMusic();
    return () => stopBackgroundMusic();
  }, []);

  // Polling: Session-Status überwachen
  useEffect(() => {
    if (!session) {
      router.push('/student');
      return;
    }

    const pollInterval = setInterval(async () => {
      const updatedSession = await sessionAPI.getSessionByCode(session.code);
      
      if (updatedSession) {
        setSession(updatedSession);

        // Status-Änderungen
        if (updatedSession.status === 'countdown' && countdown === null) {
          setCountdown(10);
          stopBackgroundMusic();
          playSound('countdown.mp3');
        } else if (updatedSession.status === 'running') {
          setStartzeit(Date.now());
          playSound('start.mp3');
          setTimeout(() => {
            router.push('/student/quiz');
          }, 500);
        }
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [session, countdown, router, setSession, setStartzeit, playSound, stopBackgroundMusic]);

  // Countdown Timer
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!session) {
    return (
      <div data-role="student" className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  return (
    <div data-role="student" className="min-h-screen p-4 flex items-center justify-center">
      {countdown !== null ? (
        <motion.div
          key={countdown}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          className="text-9xl font-bold"
        >
          {countdown > 0 ? countdown : '🚀'}
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-8xl mb-8"
          >
            ⏳
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">Warte auf Start...</h1>
          <p className="text-xl opacity-80">
            {session.teilnehmer.length} Teilnehmer bereit
          </p>
        </motion.div>
      )}
    </div>
  );
}
