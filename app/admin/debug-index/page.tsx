'use client';

import { useState, useEffect } from 'react';

export default function DebugIndexPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/debug-index');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-2xl">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Index Debug</h1>
        
        {data && (
          <>
            <div className="bg-white/10 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Übersicht</h2>
              <p><strong>Index Bin ID:</strong> {data.indexBinId}</p>
              <p><strong>Anzahl Codes:</strong> {data.totalCodes}</p>
            </div>

            <div className="bg-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Alle Schüler-Codes</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left p-2">Code</th>
                      <th className="text-left p-2">Vorname</th>
                      <th className="text-left p-2">Klasse</th>
                      <th className="text-left p-2">Bin ID</th>
                      <th className="text-left p-2">Klasse ID</th>
                      <th className="text-left p-2">Schüler Klasse ID</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.codes.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-white/10">
                        <td className="p-2 font-mono">{item.code}</td>
                        <td className="p-2">{item.schuelerVorname || '-'}</td>
                        <td className="p-2">{item.klasseName || '-'}</td>
                        <td className="p-2 font-mono text-xs">{item.binId?.substring(0, 12)}...</td>
                        <td className="p-2 font-mono text-xs">{item.klasseId?.substring(0, 12)}...</td>
                        <td className="p-2 font-mono text-xs">{item.schuelerKlasseId?.substring(0, 12)}...</td>
                        <td className="p-2">
                          {item.error ? (
                            <span className="text-red-400">❌ {item.error}</span>
                          ) : item.idsMatch && item.schuelerIdsMatch ? (
                            <span className="text-green-400">✅ OK</span>
                          ) : (
                            <span className="text-yellow-400">⚠️ ID Mismatch</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={loadData}
                className="kahoot-button bg-kahoot-blue"
              >
                🔄 Neu laden
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

