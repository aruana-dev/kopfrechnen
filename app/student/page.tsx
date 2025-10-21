'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useSessionStore } from '@/store/useSessionStore';

export default function StudentPage() {
  const router = useRouter();
  const { socket, connected } = useSocket();
  const { setSession, setRole } = useSessionStore();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    if (!socket || !connected) {
      console.log('Socket nicht verfügbar oder nicht verbunden');
      return;
    }
    if (!code || !name) {
      setError('Bitte Code und Name eingeben!');
      return;
    }

    console.log('Schüler: Versuche beizutreten mit Code:', code, 'Name:', name, 'Socket ID:', socket.id);
    
    // Entferne alte Event-Handler um Duplikate zu vermeiden
    socket.off('error');
    socket.off('teilnehmer-joined');
    
    // Registriere Event-Handler
    socket.on('error', ({ message }) => {
      console.error('Schüler: Fehler beim Beitreten:', message);
      setError(message);
      // Cleanup nach Fehler
      socket.off('error');
      socket.off('teilnehmer-joined');
    });

    socket.on('teilnehmer-joined', ({ teilnehmer, session }) => {
      console.log('Schüler: Erfolgreich beigetreten!', teilnehmer, session);
      setSession(session);
      setRole('student');
      // Cleanup nach Erfolg
      socket.off('error');
      socket.off('teilnehmer-joined');
      router.push('/student/lobby');
    });
    
    // Sende join-session Event
    socket.emit('join-session', { code, name });
  };

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        {/* Zurück zum Dashboard Link */}
        <div className="mb-4 text-center">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="text-white/80 hover:text-white transition-colors text-sm"
          >
            ← Zurück zum Dashboard
          </button>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
          🎓 Quiz beitreten
        </h1>

        <div className="kahoot-card space-y-6">
          <div>
            <label className="block text-lg font-semibold mb-2">
              Session-Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="123456"
              maxLength={6}
              className="w-full px-6 py-4 text-3xl text-center rounded-xl bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none font-bold tracking-wider"
            />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">
              Dein Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Max Mustermann"
              className="w-full px-6 py-4 text-xl rounded-xl bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none"
            />
          </div>

          {error && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-kahoot-red/80 p-4 rounded-xl text-center"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoin}
            disabled={!connected || !code || !name}
            className="kahoot-button bg-kahoot-green w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connected ? '🚀 Beitreten' : '⏳ Verbinde...'}
          </motion.button>
        </div>

        <div className="mt-4 text-center text-sm opacity-70">
          Socket Status: {connected ? '✅ Verbunden' : '❌ Nicht verbunden'}
        </div>
      </motion.div>
    </div>
  );
}
