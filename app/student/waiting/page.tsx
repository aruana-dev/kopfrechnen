'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useSessionStore } from '@/store/useSessionStore';

export default function StudentWaiting() {
  const router = useRouter();
  const { socket } = useSocket();

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

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="kahoot-card text-center max-w-2xl"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-8xl mb-6"
        >
          ⏳
        </motion.div>

        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          Fertig! 🎉
        </h1>

        <motion.p
          className="text-xl opacity-80"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Warte auf die anderen Teilnehmer...
        </motion.p>
      </motion.div>
    </div>
  );
}
