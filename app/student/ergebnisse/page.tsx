'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useServerAuthStore } from '@/store/useServerAuthStore';
import { SessionResult } from '@/lib/jsonbin';

export default function StudentErgebnissePage() {
  const router = useRouter();
  const { schueler } = useServerAuthStore();
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!schueler) {
      router.push('/student/code');
      return;
    }
    
    loadSessions();
  }, [router, isHydrated, schueler]);

  const loadSessions = async () => {
    if (!schueler) return;
    
    setLoading(true);
    try {
      // Lade Daten über API Route
      const response = await fetch('/api/schueler/sessions');
      if (!response.ok) {
        router.push('/student/code');
        return;
      }
      
      const data = await response.json();
      const klasse = { sessions: data.sessions };
      
      // Lade alle Sessions für diesen Schüler
      const alleSessions = klasse.sessions || [];
      const schuelerSessions = alleSessions.filter((session: any) => {
        // Prüfe ob ergebnisse existiert und ein Array ist
        if (!session.ergebnisse || !Array.isArray(session.ergebnisse)) {
          return false;
        }
        return session.ergebnisse.some((erg: any) => erg.schuelerCode === schueler.code);
      });
      
      // Sortiere nach Datum (neueste zuerst)
      schuelerSessions.sort((a: any, b: any) => b.datum - a.datum);
      
      setSessions(schuelerSessions);
      
    } catch (error) {
      console.error('Fehler beim Laden der Sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'addition': return '+';
      case 'subtraktion': return '-';
      case 'multiplikation': return '×';
      case 'division': return '÷';
      default: return '?';
    }
  };

  const getOperationName = (operation: string) => {
    switch (operation) {
      case 'addition': return 'Addition';
      case 'subtraktion': return 'Subtraktion';
      case 'multiplikation': return 'Multiplikation';
      case 'division': return 'Division';
      default: return operation;
    }
  };

  if (!isHydrated) {
    return (
      <div data-role="student" className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div data-role="student" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Lade deine Ergebnisse...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-role="student" className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="text-2xl hover:scale-110 transition-transform"
            title="Zurück zum Dashboard"
          >
            ←
          </button>
          <div>
            <h1 className="text-4xl md:text-6xl font-bold">
              📊 Meine Ergebnisse
            </h1>
            <p className="text-xl opacity-80">
              Hallo {schueler?.nickname || schueler?.vorname}! Hier siehst du alle deine Übungen
            </p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="kahoot-card text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold mb-4">Noch keine Übungen</h2>
            <p className="text-lg opacity-70 mb-6">
              Du hast noch keine Übungen gemacht. Starte deine erste Übung!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/student/learn')}
              className="kahoot-button bg-kahoot-green"
            >
              🚀 Erste Übung starten
            </motion.button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistiken */}
            <div className="kahoot-card">
              <h2 className="text-2xl font-bold mb-4">📈 Deine Statistiken</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-kahoot-blue">
                    {sessions.length}
                  </div>
                  <div className="text-sm opacity-70">Übungen</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-kahoot-green">
                    {sessions.reduce((sum, session) => {
                      const erg = session.ergebnisse.find(e => e.schuelerCode === schueler?.code);
                      return sum + (erg?.punkte || 0);
                    }, 0)}
                  </div>
                  <div className="text-sm opacity-70">Gesamtpunkte</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-kahoot-purple">
                    {Math.round(sessions.reduce((sum, session) => {
                      const erg = session.ergebnisse.find(e => e.schuelerCode === schueler?.code);
                      return sum + (erg?.durchschnittsZeit || 0);
                    }, 0) / sessions.length / 1000)}s
                  </div>
                  <div className="text-sm opacity-70">Ø Zeit/Aufgabe</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-kahoot-pink">
                    {Math.round(sessions.reduce((sum, session) => {
                      const erg = session.ergebnisse.find(e => e.schuelerCode === schueler?.code);
                      if (!erg) return sum;
                      const richtig = erg.antworten.filter(a => a.richtig).length;
                      const gesamt = erg.antworten.length;
                      return sum + (richtig / gesamt * 100);
                    }, 0) / sessions.length)}%
                  </div>
                  <div className="text-sm opacity-70">Ø Richtigkeit</div>
                </div>
              </div>
            </div>

            {/* Sessions */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">📚 Deine Übungen</h2>
              {sessions.map((session, i) => {
                const ergebnis = session.ergebnisse.find(erg => erg.schuelerCode === schueler?.code);
                if (!ergebnis) return null;
                
                const richtig = ergebnis.antworten.filter(a => a.richtig || a.korrekt).length;
                const gesamt = ergebnis.antworten.length;
                const richtigkeit = gesamt > 0 ? Math.round((richtig / gesamt) * 100) : 0;
                
                return (
                  <motion.div
                    key={session.sessionId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="kahoot-card cursor-pointer hover:bg-white/20 transition-colors"
                    onClick={() => router.push(`/student/ergebnisse/${session.sessionId}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="text-2xl">
                            {new Date(session.datum).toLocaleDateString('de-DE')}
                          </div>
                          {session.settings?.operationen && session.settings.operationen.length > 0 && (
                            <div className="text-sm opacity-70">
                              {session.settings.operationen.map(getOperationName).join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="text-sm opacity-70 mb-2">
                          {session.settings?.anzahlAufgaben || gesamt} Aufgaben
                          {session.settings?.reihen && session.settings.reihen.length > 0 && (
                            <> • {session.settings.reihen.join(', ')}er-Reihen</>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-kahoot-green">✓</span>
                            <span>{richtig} richtig</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-kahoot-red">✗</span>
                            <span>{gesamt - richtig} falsch</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-kahoot-blue">⏱️</span>
                            <span>{(ergebnis.durchschnittsZeit / 1000).toFixed(1)}s Ø</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-kahoot-green mb-1">
                          {ergebnis.punkte} Punkte
                        </div>
                        <div className={`text-lg font-bold ${
                          richtigkeit >= 80 ? 'text-kahoot-green' :
                          richtigkeit >= 60 ? 'text-kahoot-yellow' :
                          'text-kahoot-red'
                        }`}>
                          {richtigkeit}% richtig
                        </div>
                        <div className="text-sm opacity-70 mt-1">
                          Klicken für Details →
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
