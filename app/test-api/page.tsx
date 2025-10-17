'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function TestAPIPage() {
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testKey = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Test 1: Einfacher Bin erstellen
      const testData = { test: 'Hello from Test', timestamp: Date.now() };
      
      console.log('🧪 Teste API Key...');
      console.log('📤 Key:', apiKey.substring(0, 15) + '...');

      const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey.trim(),
        },
        body: JSON.stringify(testData),
      });

      console.log('📥 Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        setResult({
          success: true,
          message: '✅ API Key funktioniert!',
          binId: data.metadata.id,
          data: data,
        });
      } else {
        const error = await response.text();
        setResult({
          success: false,
          message: '❌ API Key ungültig',
          status: response.status,
          error: error,
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: '❌ Netzwerkfehler',
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testFromEnv = async () => {
    const envKey = process.env.NEXT_PUBLIC_JSONBIN_API_KEY;
    if (envKey) {
      setApiKey(envKey);
      setTimeout(() => testKey(), 100);
    } else {
      setResult({
        success: false,
        message: '❌ Kein API Key in .env.local gefunden',
      });
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🧪 JSONBin.io API Tester</h1>

        <div className="kahoot-card space-y-6">
          <div>
            <label className="block text-lg font-semibold mb-2">
              API Master Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="$2a$10..."
              className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none font-mono text-sm"
            />
            <p className="text-sm opacity-70 mt-2">
              Beginnt mit $2a$10... oder $2b$10...
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={testKey}
              disabled={!apiKey || loading}
              className="flex-1 py-3 bg-kahoot-blue rounded-lg font-bold disabled:opacity-50"
            >
              {loading ? '⏳ Teste...' : '🧪 API Key testen'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={testFromEnv}
              disabled={loading}
              className="flex-1 py-3 bg-kahoot-green rounded-lg font-bold disabled:opacity-50"
            >
              🔍 Aus .env.local
            </motion.button>
          </div>

          {result && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`p-6 rounded-xl ${
                result.success
                  ? 'bg-kahoot-green/30 border-2 border-kahoot-green'
                  : 'bg-kahoot-red/30 border-2 border-kahoot-red'
              }`}
            >
              <h3 className="text-2xl font-bold mb-4">{result.message}</h3>
              <pre className="bg-black/30 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </motion.div>
          )}

          <div className="pt-6 border-t border-white/20">
            <h3 className="font-bold mb-2">💡 Hilfe:</h3>
            <ul className="text-sm opacity-80 space-y-2">
              <li>1. Gehe zu <a href="https://jsonbin.io" target="_blank" className="underline">jsonbin.io</a></li>
              <li>2. Login → Profil-Icon → "API Keys"</li>
              <li>3. Kopiere den <strong>"Master Key"</strong> (beginnt mit $2a$ oder $2b$)</li>
              <li>4. Füge ihn hier ein und teste</li>
              <li>5. Wenn ✅ → kopiere in .env.local</li>
            </ul>
          </div>

          <div className="pt-6 border-t border-white/20">
            <h3 className="font-bold mb-2">📝 .env.local Setup:</h3>
            <pre className="bg-black/30 p-4 rounded-lg text-sm">
              NEXT_PUBLIC_JSONBIN_API_KEY={apiKey || 'dein_key_hier'}
            </pre>
            <p className="text-sm opacity-70 mt-2">
              Datei im Projekt-Root erstellen, dann Server neu starten!
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-sm opacity-70 hover:opacity-100">
            ← Zurück zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}

