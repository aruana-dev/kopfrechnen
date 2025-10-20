'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleResetPassword = async () => {
    if (!username || !newPassword) {
      setResult({ success: false, message: 'Bitte alle Felder ausfüllen' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message || 'Passwort erfolgreich zurückgesetzt!' });
        setUsername('');
        setNewPassword('');
      } else {
        setResult({ success: false, message: data.error || 'Fehler beim Zurücksetzen' });
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'Netzwerkfehler' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          <h1 className="text-4xl font-bold mb-2 text-gray-800">
            🔐 Lehrer-Passwort zurücksetzen
          </h1>
          <p className="text-gray-600 mb-6">
            Admin-Tool zum Zurücksetzen von Lehrer-Passwörtern
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benutzername
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="z.B. philipgertsch"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neues Passwort
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mindestens 6 Zeichen"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Wird zurückgesetzt...' : '🔄 Passwort zurücksetzen'}
          </motion.button>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-lg ${
                result.success
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              <p className="font-semibold">{result.success ? '✅ Erfolg!' : '❌ Fehler'}</p>
              <p className="mt-1">{result.message}</p>
            </motion.div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Wichtig:</strong> Dieses Tool setzt das Passwort für einen
              existierenden Lehrer-Account zurück. Der Lehrer kann sich danach mit dem
              neuen Passwort einloggen.
            </p>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              ← Zurück zur Startseite
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

