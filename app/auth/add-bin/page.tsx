'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function AddBinPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [binId, setBinId] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAdd = () => {
    if (!username || !binId) {
      alert('Bitte beide Felder ausfüllen!');
      return;
    }

    const teacherMap = JSON.parse(localStorage.getItem('teacherBins') || '{}');
    teacherMap[username] = binId;
    localStorage.setItem('teacherBins', JSON.stringify(teacherMap));
    
    setSuccess(true);
    
    setTimeout(() => {
      router.push('/auth/login');
    }, 2000);
  };

  return (
    <div data-role="teacher" className="min-h-screen p-4 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <h1 className="text-4xl font-bold text-center mb-8">
          🔧 Bin-ID hinzufügen
        </h1>

        <div className="kahoot-card space-y-6">
          <p className="text-sm opacity-80">
            Wenn Sie sich schon registriert haben, aber die Bin-ID fehlt:
          </p>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Ihr Benutzername
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="p"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Bin-ID aus JSONBin.io Dashboard
            </label>
            <input
              type="text"
              value={binId}
              onChange={(e) => setBinId(e.target.value)}
              placeholder="67..."
              className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none font-mono text-sm"
            />
            <p className="text-xs opacity-70 mt-2">
              Gehe zu jsonbin.io → Dashboard → Finde "teacher_IhrUsername" → Kopiere die ID
            </p>
          </div>

          {success && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-kahoot-green/80 p-4 rounded-xl text-center"
            >
              ✅ Gespeichert! Weiterleitung zum Login...
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            disabled={success}
            className="kahoot-button bg-kahoot-blue w-full disabled:opacity-50"
          >
            Speichern
          </motion.button>

          <button
            onClick={() => router.push('/auth/login')}
            className="text-sm opacity-70 hover:opacity-100 block text-center w-full"
          >
            ← Zurück zum Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}

