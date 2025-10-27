'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useServerAuthStore } from '@/store/useServerAuthStore';

export default function StudentCodePage() {
  const router = useRouter();
  const { loginSchueler, schueler, isLoading, error } = useServerAuthStore();
  const [schuelerCode, setSchuelerCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [mode, setMode] = useState<'code' | 'nickname'>('code');

  const handleSubmitCode = async () => {
    if (!schuelerCode) {
      return;
    }

    const codeUpper = schuelerCode.toUpperCase();
    console.log('🔍 Suche Code:', codeUpper);
    
    // Setze Loading-State über den Store
    useServerAuthStore.setState({ isLoading: true, error: null });
    
    // Versuche Code zu validieren (mit Timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 Sekunden Timeout
      
      console.log('📤 Sende Validierungs-Request...');
      const response = await fetch(`/api/klasse/validate-code?code=${codeUpper}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      console.log('📥 Response Status:', response.status);
      const data = await response.json();
      console.log('📥 Response Data:', data);
      
      if (data.success) {
        console.log('✅ Code gültig');
        
        // Prüfe ob Schüler bereits einen gespeicherten Nickname hat
        if (data.klasse?.schueler?.nickname) {
          console.log('✅ Nickname bereits gespeichert, logge direkt ein:', data.klasse.schueler.nickname);
          // Direkt einloggen mit gespeichertem Nickname
          const success = await loginSchueler(codeUpper, data.klasse.schueler.nickname);
          if (success) {
            router.push('/student/dashboard');
          }
        } else {
          console.log('ℹ️ Kein Nickname gespeichert, wechsle zu Nickname-Eingabe');
          useServerAuthStore.setState({ isLoading: false, error: null });
          setMode('nickname');
        }
      } else {
        console.log('❌ Code ungültig:', data.message);
        useServerAuthStore.setState({ 
          isLoading: false, 
          error: data.message || 'Ungültiger Code' 
        });
      }
    } catch (err: any) {
      console.error('❌ Fehler beim Validieren des Codes:', err);
      if (err.name === 'AbortError') {
        useServerAuthStore.setState({ 
          isLoading: false, 
          error: 'Zeitüberschreitung - bitte versuche es erneut' 
        });
      } else {
        useServerAuthStore.setState({ 
          isLoading: false, 
          error: 'Netzwerkfehler - bitte versuche es erneut' 
        });
      }
    }
  };

  const handleSubmitNickname = async () => {
    if (!nickname || !schuelerCode) {
      return;
    }
    
    console.log('Versuche Login mit Code:', schuelerCode, 'Nickname:', nickname);
    const success = await loginSchueler(schuelerCode.toUpperCase(), nickname);
    console.log('Login erfolgreich?', success);
    
    if (success) {
      router.push('/student/dashboard');
    } else {
      console.log('Login fehlgeschlagen, Fehler:', error);
    }
  };

  return (
    <div data-role="student" className="min-h-screen p-4 flex items-center justify-center">
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
                  }}
                  placeholder="ABCD12"
                  maxLength={6}
                  className="w-full px-6 py-4 text-3xl text-center rounded-xl bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none font-bold tracking-wider uppercase"
                />
                <p className="text-sm opacity-70 mt-2 text-center">
                  Frag deine Lehrkraft nach deinem Code
                </p>
              </div>

              {(error || isLoading) && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-4 rounded-xl text-center ${
                    isLoading ? 'bg-kahoot-blue/80' : 'bg-kahoot-red/80'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin text-2xl">⏳</div>
                      <span>Suche Code: {schuelerCode}...</span>
                    </div>
                  ) : error}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmitCode}
                disabled={!schuelerCode || isLoading}
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
                  }}
                  placeholder="z.B. Mathe-King"
                  maxLength={20}
                  className="w-full px-6 py-4 text-xl text-center rounded-xl bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nickname) {
                      handleSubmitNickname();
                    }
                  }}
                />
                <p className="text-sm opacity-70 mt-2 text-center">
                  Dieser Name wird in der Rangliste angezeigt
                </p>
              </div>

              {(error || isLoading) && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-4 rounded-xl text-center ${
                    isLoading ? 'bg-kahoot-blue/80' : 'bg-kahoot-red/80'
                  }`}
                >
                  {isLoading ? 'Lädt...' : error}
                </motion.div>
              )}

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('code')}
                  className="kahoot-button bg-white/20 flex-1"
                >
                  ← Zurück
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitNickname}
                  disabled={!nickname || isLoading}
                  className="kahoot-button bg-kahoot-green flex-[2] disabled:opacity-50"
                >
                  Los geht's! 🚀
                </motion.button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

