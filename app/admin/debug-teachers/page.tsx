'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function DebugTeachersPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/debug-teachers');
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🔍 Debug: Lehrer in Index-Bin</h1>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={loadData}
          disabled={loading}
          className="kahoot-button bg-kahoot-blue mb-8 disabled:opacity-50"
        >
          {loading ? '⏳ Lädt...' : '🔍 Lehrer-Daten laden'}
        </motion.button>

        {error && (
          <div className="kahoot-card bg-kahoot-red mb-4">
            <p className="font-bold">❌ Fehler:</p>
            <p>{error}</p>
          </div>
        )}

        {data && (
          <div className="kahoot-card space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-2">📦 Index-Bin ID:</h2>
              <p className="font-mono bg-black/30 p-2 rounded">{data.indexBinId}</p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2">👨‍🏫 Lehrer ({Object.keys(data.teachers || {}).length}):</h2>
              {Object.keys(data.teachers || {}).length === 0 ? (
                <p className="opacity-70">Keine Lehrer gefunden</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(data.teachers || {}).map(([username, binId]) => (
                    <div key={username} className="bg-white/10 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{username}</span>
                        <span className="font-mono text-sm opacity-70">{binId as string}</span>
                      </div>
                      {data.teacherDetails[binId as string] && (
                        <div className="mt-2 text-sm opacity-80">
                          <div>Klassen: {data.teacherDetails[binId as string].klassen?.length || 0}</div>
                          <div>Erstellt: {new Date(data.teacherDetails[binId as string].created).toLocaleString('de-DE')}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2">📊 Raw Index-Bin Daten:</h2>
              <pre className="bg-black/30 p-4 rounded overflow-auto text-xs">
                {JSON.stringify(data.indexBinData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

