'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { sessionAPI } from '@/hooks/usePolling';
import { useSessionStore } from '@/store/useSessionStore';

export default function StudentWaiting() {
  const router = useRouter();
  const { session, setSession } = useSessionStore();

  useEffect(() => {
    if (!session) {
      router.push('/student');
      return;
    }

    const pollInterval = setInterval(async () => {
      const updatedSession = await sessionAPI.getSessionByCode(session.code);
      
      if (updatedSession) {
        setSession(updatedSession);

        if (updatedSession.status === 'finished') {
          // Session ist beendet, zur Ergebnis-Seite
          router.push('/results');
        }
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [session, router, setSession]);

  if (!session) {
    return (
      <div data-role="student" className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  const fertigueTeilnehmer = session.teilnehmer.filter(
    (t: any) => t.antworten.length === session.aufgaben.length
  );

  return (
    <div data-role="student" className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="text-8xl mb-8"
        >
          ⏳
        </motion.div>

        <h1 className="text-4xl font-bold mb-4">Super! Du bist fertig! 🎉</h1>
        <p className="text-2xl mb-8">
          Warte, bis alle anderen fertig sind...
        </p>

        <div className="kahoot-card inline-block">
          <p className="text-xl">
            {fertigueTeilnehmer.length} / {session.teilnehmer.length} fertig
          </p>
          <div className="w-full bg-white/20 rounded-full h-4 mt-4">
            <motion.div
              className="bg-kahoot-green h-4 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${(fertigueTeilnehmer.length / session.teilnehmer.length) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
