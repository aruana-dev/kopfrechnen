'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useSessionStore } from '@/store/useSessionStore';

export default function StudentLobby() {
  const router = useRouter();
  const { socket } = useSocket();
  const { session, setSession } = useSessionStore();
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('teilnehmer-joined', ({ session: updatedSession }) => {
      setSession(updatedSession);
    });

    socket.on('teilnehmer-left', ({ session: updatedSession }) => {
      setSession(updatedSession);
    });

    socket.on('session-countdown', () => {
      setCountdown(10);
    });

    socket.on('session-started', ({ aufgaben }) => {
      router.push('/student/quiz');
    });

    return () => {
      socket.off('teilnehmer-joined');
      socket.off('teilnehmer-left');
      socket.off('session-countdown');
      socket.off('session-started');
    };
  }, [socket, router, setSession]);

  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Countdown Overlay */}
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

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="kahoot-card text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-6"
          >
            ⏳
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Warte auf Start...
          </h1>

          <p className="text-xl opacity-80 mb-8">
            {session.teilnehmer.length} Teilnehmer in der Lobby
          </p>

          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-lg"
          >
            Die Lehrkraft wird das Quiz bald starten
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
