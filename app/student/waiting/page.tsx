'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useSessionStore } from '@/store/useSessionStore';
import SeriesCatcher from '@/app/components/SeriesCatcher';

export default function StudentWaiting() {
  const router = useRouter();
  const { socket } = useSocket();
  const { session } = useSessionStore();

  useEffect(() => {
    if (!socket) return;

    const handleSessionFinished = ({ rangliste }: any) => {
      console.log('Schüler Waiting: Session beendet Event empfangen, Rangliste:', rangliste);
      // Stats im Store setzen
      useSessionStore.getState().setStats({ teilnehmer: rangliste });
      router.push('/results');
    };

    socket.on('session-finished', handleSessionFinished);

    return () => {
      socket.off('session-finished', handleSessionFinished);
    };
  }, [socket, router]);

  // Finde eine Reihe aus den Session-Settings für das Spiel
  const gameSeries = session?.settings.reihen?.[0] || 2;

  return (
    <div data-role="student" className="min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold mb-2">
              Fertig! 🎉
            </h1>
            <p className="text-xl opacity-80">
              Warte auf die anderen Teilnehmer...
            </p>
          </div>

          {/* Mini-Game während des Wartens */}
          <SeriesCatcher series={gameSeries} />
        </motion.div>
      </div>
    </div>
  );
}
