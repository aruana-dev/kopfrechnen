'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function MigrateTeachersPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleMigrate = async () => {
    if (!confirm('Alle existierenden Lehrer in die Index-Bin migrieren?')) {
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/migrate-teachers', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Migration fehlgeschlagen');
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
        <h1 className="text-4xl font-bold mb-8">🔧 Lehrer-Migration</h1>

        <div className="kahoot-card mb-8">
          <h2 className="text-2xl font-bold mb-4">Was macht dieses Tool?</h2>
          <ul className="list-disc list-inside space-y-2 opacity-90">
            <li>Findet alle Lehrer-Bins in JSONBin</li>
            <li>Trägt sie in die Index-Bin ein</li>
            <li>Ermöglicht Login für alte Accounts</li>
          </ul>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleMigrate}
          disabled={loading}
          className="kahoot-button bg-kahoot-green w-full mb-8 disabled:opacity-50"
        >
          {loading ? '⏳ Migriere...' : '🚀 Lehrer migrieren'}
        </motion.button>

        {error && (
          <div className="kahoot-card bg-kahoot-red mb-4">
            <p className="font-bold">❌ Fehler:</p>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="kahoot-card space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-2">✅ Migration erfolgreich!</h2>
              <p>Gefundene Lehrer-Bins: {result.foundTeachers}</p>
              <p>Bereits in Index: {result.alreadyInIndex}</p>
              <p>Neu hinzugefügt: {result.addedToIndex}</p>
            </div>

            {result.teachers && result.teachers.length > 0 && (
              <div>
                <h3 className="font-bold mb-2">Migrierte Lehrer:</h3>
                <div className="space-y-2">
                  {result.teachers.map((teacher: any) => (
                    <div key={teacher.binId} className="bg-white/10 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{teacher.username}</span>
                        <span className="font-mono text-sm opacity-70">{teacher.binId}</span>
                      </div>
                      <div className="text-sm opacity-80 mt-1">
                        Status: {teacher.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

