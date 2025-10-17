'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { jsonbin } from '@/lib/jsonbin';

export default function FortschrittPage() {
  const router = useRouter();
  const { teacher, activeKlasse, setActiveKlasse } = useAuthStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teacher || !activeKlasse) {
      router.push('/teacher/dashboard');
      return;
    }
    
    setSessions(activeKlasse.sessions || []);
  }, [teacher, activeKlasse, router]);

  const handleDeleteSchuelerSession = async (schuelerCode: string, sessionId: string, schuelerName: string) => {
    if (!activeKlasse) return;
    if (!confirm(`Session für ${schuelerName} wirklich löschen?`)) return;

    setLoading(true);
    try {
      await jsonbin.deleteSchuelerSession(activeKlasse.id, schuelerCode, sessionId);
      const updatedKlasse = await jsonbin.readBin(activeKlasse.id);
      setActiveKlasse(updatedKlasse);
      setSessions(updatedKlasse.sessions || []);
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Session!');
    } finally {
      setLoading(false);
    }
  };

  const getSchuelerName = (code: string): string => {
    const schueler = activeKlasse?.schueler.find(s => s.code === code);
    return schueler ? schueler.vorname : code;
  };

  if (!activeKlasse) return null;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push('/teacher/klasse')}
          className="text-sm opacity-70 hover:opacity-100 mb-4"
        >
          ← Zurück zur Klasse
        </button>

        <h1 className="text-4xl md:text-5xl font-bold mb-8">
          📊 Fortschritt - {activeKlasse.name}
        </h1>

        {sessions.length === 0 ? (
          <div className="kahoot-card text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl opacity-70">
              Noch keine Sessions vorhanden
            </p>
            <p className="opacity-60 mt-2">
              Die Ergebnisse erscheinen hier, sobald Sessions gespielt wurden
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sessions.map((session, index) => (
              <motion.div
                key={session.sessionId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="kahoot-card"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">
                      Session {sessions.length - index}
                    </h3>
                    <p className="opacity-70">
                      {new Date(session.datum).toLocaleString('de-DE')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-70">Teilnehmer</p>
                    <p className="text-3xl font-bold">
                      {session.ergebnisse?.length || 0}
                    </p>
                  </div>
                </div>

                {session.ergebnisse && session.ergebnisse.length > 0 && (
                  <div className="space-y-2">
                    {session.ergebnisse
                      .sort((a: any, b: any) => b.punkte - a.punkte)
                      .map((erg: any, i: number) => (
                        <div
                          key={i}
                          className="bg-white/10 p-3 rounded-lg flex justify-between items-center"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                            </span>
                            <div>
                              <p className="font-bold">{erg.nickname}</p>
                              <p className="text-sm opacity-70">
                                {getSchuelerName(erg.schuelerCode)} ({erg.schuelerCode})
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold">{erg.punkte} Punkte</p>
                              <p className="text-sm opacity-70">
                                ⏱️ {(erg.durchschnittsZeit / 1000).toFixed(1)}s
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteSchuelerSession(erg.schuelerCode, session.sessionId, getSchuelerName(erg.schuelerCode))}
                              disabled={loading}
                              className="text-xl hover:scale-110 transition-transform disabled:opacity-50"
                              title="Session löschen"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

