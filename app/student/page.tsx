'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { sessionAPI } from '@/hooks/usePolling';
import { useSessionStore } from '@/store/useSessionStore';
import { useServerAuthStore } from '@/store/useServerAuthStore';

export default function StudentPage() {
  const router = useRouter();
  const { setSession, setRole, setTeilnehmerId } = useSessionStore();
  const { schueler } = useServerAuthStore();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code || !name) {
      setError('Bitte Code und Name eingeben!');
      return;
    }

    setLoading(true);
    console.log('Schüler: Versuche beizutreten mit Code:', code, 'Name:', name);
    
    try {
      // Hole Session per Code
      const session = await sessionAPI.getSessionByCode(code.toUpperCase());
      
      if (!session) {
        setError('Session nicht gefunden!');
        setLoading(false);
        return;
      }

      // Trete Session bei (mit Schüler-Code falls vorhanden)
      const schuelerCode = schueler?.code;
      console.log('👤 Trete bei mit Code:', schuelerCode || 'N/A');
      const result = await sessionAPI.joinSession(session.id, name, schuelerCode);
      
      if (result) {
        console.log('✅ Erfolgreich beigetreten!', result);
        setSession(result.session);
        setRole('student');
        setTeilnehmerId(result.teilnehmer.id);
        router.push('/student/lobby');
      } else {
        setError('Fehler beim Beitreten!');
      }
    } catch (err) {
      console.error('Fehler:', err);
      setError('Fehler beim Beitreten!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-role="student" className="min-h-screen p-4 flex items-center justify-center">
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
                setCode(e.target.value.toUpperCase());
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
              maxLength={20}
              className="w-full px-6 py-4 text-xl rounded-xl bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border-2 border-red-500 rounded-xl p-4 text-center"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoin}
            disabled={loading}
            className="kahoot-button bg-kahoot-green w-full disabled:opacity-50"
          >
            {loading ? '⏳ Trete bei...' : '🚀 Beitreten'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
