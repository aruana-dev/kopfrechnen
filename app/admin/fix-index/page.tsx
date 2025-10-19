'use client';

import { useState } from 'react';
import { jsonbin } from '@/lib/jsonbin';

export default function FixIndexPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fixIndex = async () => {
    setLoading(true);
    setStatus('Starte Index-Reparatur...');

    try {
      const response = await fetch('/api/admin/fix-index', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setStatus(`✅ ${data.message}`);
      } else {
        setStatus(`❌ Fehler: ${data.error}`);
      }
    } catch (error) {
      setStatus(`❌ Fehler: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Index-Reparatur</h1>
        
        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <p className="mb-4">
            Diese Seite repariert den Index und korrigiert alle Klassen-IDs.
          </p>
          
          <button
            onClick={fixIndex}
            disabled={loading}
            className="kahoot-button bg-kahoot-blue disabled:opacity-50"
          >
            {loading ? 'Repariere...' : 'Index reparieren'}
          </button>
        </div>

        {status && (
          <div className="bg-white/10 rounded-xl p-6">
            <h2 className="font-bold mb-2">Status:</h2>
            <pre className="whitespace-pre-wrap text-sm">{status}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

