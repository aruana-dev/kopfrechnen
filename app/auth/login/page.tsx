'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useServerAuthStore } from '@/store/useServerAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const { loginLehrer } = useServerAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await loginLehrer(username, password, mode);
      if (success) {
        router.push('/teacher/dashboard');
      } else {
        if (mode === 'login') {
          setError('Ungültiger Benutzername oder Passwort');
        } else {
          setError('Registrierung fehlgeschlagen. Benutzername möglicherweise bereits vergeben.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <h1 className="text-5xl font-bold text-center mb-8">
          👨‍🏫 Lehrer-Login
        </h1>

        <div className="kahoot-card">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                mode === 'login'
                  ? 'bg-kahoot-blue text-white'
                  : 'bg-white/20 text-white/60'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                mode === 'register'
                  ? 'bg-kahoot-blue text-white'
                  : 'bg-white/20 text-white/60'
              }`}
            >
              Registrieren
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Benutzername
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none"
              />
            </div>

            {error && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-kahoot-red/80 p-3 rounded-lg text-center"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="kahoot-button bg-kahoot-green w-full disabled:opacity-50"
            >
              {loading ? '...' : mode === 'login' ? 'Einloggen' : 'Registrieren'}
            </motion.button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/20 space-y-2">
            <button
              onClick={() => router.push('/auth/add-bin')}
              className="text-sm opacity-70 hover:opacity-100 transition-opacity block w-full text-center"
            >
              🔧 Bestehenden Account verbinden
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-sm opacity-70 hover:opacity-100 transition-opacity block w-full text-center"
            >
              ← Zurück zum Gast-Modus
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

