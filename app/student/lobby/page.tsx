'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useSessionStore } from '@/store/useSessionStore';
import SeriesCatcher from '@/app/components/SeriesCatcher';

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

  // Finde eine Reihe aus den Session-Settings für das Spiel
  const gameSeries = session.settings.reihen?.[0] || 2;

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
        >
          <div className="text-center mb-4">
            <p className="text-xl opacity-80">
              {session.teilnehmer.length} Teilnehmer warten • Die Lehrkraft startet gleich
            </p>
          </div>

          {/* Mini-Game statt langweiliger Wartezeit */}
          <SeriesCatcher series={gameSeries} />
        </motion.div>
      </div>
    </div>
  );
}
