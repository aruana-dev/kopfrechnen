'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function SetupIndexPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [indexBinId, setIndexBinId] = useState('');
  const [loading, setLoading] = useState(false);

  const createIndexBin = async () => {
    setLoading(true);
    setStatus('Erstelle Index-Bin...');

    try {
      const apiKey = process.env.NEXT_PUBLIC_JSONBIN_API_KEY;
      
      if (!apiKey) {
        setStatus('❌ API Key nicht gefunden!');
        setLoading(false);
        return;
      }

      const indexData = {
        type: 'kopfrechnen_index',
        schuelerCodes: {},
        created: Date.now(),
        version: '1.0',
      };

      const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey,
          'X-Bin-Name': 'kopfrechnen_schueler_index_v1',
        },
        body: JSON.stringify(indexData),
      });

      if (!response.ok) {
        const error = await response.text();
        setStatus(`❌ Fehler: ${error}`);
        setLoading(false);
        return;
      }

      const result = await response.json();
      const binId = result.metadata.id;

      // Speichere im localStorage
      localStorage.setItem('kopfrechnen_index_bin_id', binId);

      setIndexBinId(binId);
      setStatus(`✅ Index-Bin erfolgreich erstellt!\n\nBin-ID: ${binId}\n\nGespeichert im localStorage.`);
    } catch (error: any) {
      setStatus(`❌ Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingBin = () => {
    const binId = localStorage.getItem('kopfrechnen_index_bin_id');
    if (binId) {
      setIndexBinId(binId);
      setStatus(`📦 Gespeicherte Bin-ID gefunden:\n\n${binId}`);
    } else {
      setStatus('⚠️ Keine Bin-ID im localStorage gefunden.');
    }
  };

  const setManualBinId = () => {
    const binId = prompt('Gib die Index-Bin-ID ein:');
    if (binId) {
      localStorage.setItem('kopfrechnen_index_bin_id', binId);
      setIndexBinId(binId);
      setStatus(`✅ Bin-ID manuell gesetzt:\n\n${binId}`);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🔧 Index-Bin Setup</h1>

        <div className="kahoot-card space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Was ist der Index-Bin?</h2>
            <p className="opacity-80">
              Der Index-Bin speichert die Zuordnung von Schüler-Codes zu Klassen.
              Damit Schüler sich mit ihrem Code einloggen können, muss dieser Bin existieren.
            </p>
          </div>

          <div className="pt-6 border-t border-white/20">
            <h3 className="text-xl font-bold mb-4">Aktionen:</h3>
            
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={loadExistingBin}
                className="w-full py-3 bg-kahoot-blue rounded-lg font-bold"
              >
                🔍 Existierende Bin-ID anzeigen
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={createIndexBin}
                disabled={loading}
                className="w-full py-3 bg-kahoot-green rounded-lg font-bold disabled:opacity-50"
              >
                {loading ? '⏳ Erstelle...' : '➕ Neuen Index-Bin erstellen'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={setManualBinId}
                className="w-full py-3 bg-kahoot-purple rounded-lg font-bold"
              >
                ✏️ Bin-ID manuell setzen
              </motion.button>
            </div>
          </div>

          {status && (
            <div className="pt-6 border-t border-white/20">
              <h3 className="text-lg font-bold mb-2">Status:</h3>
              <pre className="bg-black/30 p-4 rounded-lg whitespace-pre-wrap text-sm">
                {status}
              </pre>
            </div>
          )}

          {indexBinId && (
            <div className="pt-6 border-t border-white/20">
              <h3 className="text-lg font-bold mb-2">📋 Kopiere diese Bin-ID:</h3>
              <div className="bg-kahoot-green/20 p-4 rounded-lg">
                <p className="font-mono text-sm break-all">{indexBinId}</p>
              </div>
              <p className="text-sm opacity-70 mt-2">
                Speichere diese ID gut! Sie wird für alle Schüler-Logins benötigt.
              </p>
            </div>
          )}

          <div className="pt-6 border-t border-white/20">
            <h3 className="text-lg font-bold mb-2">💡 Tipp für Production:</h3>
            <p className="text-sm opacity-80">
              1. Erstelle den Index-Bin lokal<br />
              2. Kopiere die Bin-ID<br />
              3. Setze als Environment Variable in Vercel:<br />
              <code className="bg-black/30 px-2 py-1 rounded">NEXT_PUBLIC_INDEX_BIN_ID=die_bin_id</code>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm opacity-70 hover:opacity-100"
          >
            ← Zurück zur Startseite
          </button>
        </div>
      </div>
    </div>
  );
}

