'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { jsonbin } from '@/lib/jsonbin';
import { useAuthStore } from '@/store/useAuthStore';

export default function StudentCodePage() {
  const router = useRouter();
  const { setActiveKlasse } = useAuthStore();
  const [schuelerCode, setSchuelerCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'code' | 'nickname'>('code');

  const handleSubmitCode = async () => {
    if (!schuelerCode) {
      setError('Bitte Schüler-Code eingeben');
      return;
    }

    setError('Suche Code...');
    
    try {
      const codeUpper = schuelerCode.toUpperCase();
      console.log('Suche Code:', codeUpper);
      
      // Finde Klasse über Index-Bin
      const result = await jsonbin.findKlasseBySchuelerCode(codeUpper);
      
      if (!result) {
        setError('Ungültiger Schüler-Code');
        return;
      }

      const { klasse, binId } = result;
      const schueler = klasse.schueler?.find((s: any) => s.code === codeUpper);
      
      if (!schueler) {
        setError('Ungültiger Schüler-Code');
        return;
      }

      console.log('Code gefunden! Klasse:', klasse.name, 'Schüler:', schueler.vorname);
      setActiveKlasse({ ...klasse, id: binId });
      localStorage.setItem('schuelerCode', codeUpper);
      setMode('nickname');
      setError('');
    } catch (err) {
      console.error('Fehler beim Suchen des Codes:', err);
      setError('Fehler beim Suchen des Codes');
    }
  };

  const handleSubmitNickname = () => {
    if (!nickname) {
      setError('Bitte Nickname eingeben');
      return;
    }
    
    localStorage.setItem('schuelerNickname', nickname);
    router.push('/student/dashboard');
  };

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <button
          onClick={() => router.push('/')}
          className="text-sm opacity-70 hover:opacity-100 mb-4"
        >
          ← Zurück
        </button>

        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
          {mode === 'code' ? '🎯 Schüler-Login' : '😊 Nickname wählen'}
        </h1>

        <div className="kahoot-card space-y-6">
          {mode === 'code' ? (
            <>
              <div>
                <label className="block text-lg font-semibold mb-2">
                  Dein Schüler-Code
                </label>
                <input
                  type="text"
                  value={schuelerCode}
                  onChange={(e) => {
                    setSchuelerCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="ABCD12"
                  maxLength={6}
                  className="w-full px-6 py-4 text-3xl text-center rounded-xl bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none font-bold tracking-wider uppercase"
                />
                <p className="text-sm opacity-70 mt-2 text-center">
                  Frag deine Lehrkraft nach deinem Code
                </p>
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
                onClick={handleSubmitCode}
                disabled={!schuelerCode}
                className="kahoot-button bg-kahoot-blue w-full disabled:opacity-50"
              >
                Weiter →
              </motion.button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-lg font-semibold mb-2">
                  Wähle einen Nickname
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setError('');
                  }}
                  placeholder="z.B. Mathe-King"
                  maxLength={20}
                  className="w-full px-6 py-4 text-xl text-center rounded-xl bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none"
                />
                <p className="text-sm opacity-70 mt-2 text-center">
                  Dieser Name wird in der Rangliste angezeigt
                </p>
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
                onClick={handleSubmitNickname}
                disabled={!nickname}
                className="kahoot-button bg-kahoot-green w-full disabled:opacity-50"
              >
                Los geht's! 🚀
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

