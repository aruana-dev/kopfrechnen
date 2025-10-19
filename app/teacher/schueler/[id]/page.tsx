'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { jsonbin, Schueler, SessionResult } from '@/lib/jsonbin';

interface SchuelerAnalyse {
  schwaechen: string[];
  staerken: string[];
  empfehlungen: string[];
  gesamtPunkte: number;
  durchschnittsZeit: number;
  richtigeAntworten: number;
  falscheAntworten: number;
}

export default function SchuelerProfilPage() {
  const router = useRouter();
  const params = useParams();
  const { teacher, activeKlasse } = useAuthStore();
  const [schueler, setSchueler] = useState<Schueler | null>(null);
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [analyse, setAnalyse] = useState<SchuelerAnalyse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!teacher || !activeKlasse) {
      router.push('/teacher/dashboard');
      return;
    }

    loadSchuelerData();
  }, [teacher, activeKlasse, router, isHydrated, params.id]);

  const loadSchuelerData = async () => {
    if (!activeKlasse || !params.id) return;
    
    setLoading(true);
    try {
      // Lade aktuelle Klassendaten
      const updatedKlasse = await jsonbin.readBin(activeKlasse.id);
      if (!updatedKlasse) {
        router.push('/teacher/klasse');
        return;
      }
      
      // Finde den Schüler
      const schueler = (updatedKlasse as any).schueler?.find((s: any) => s.id === params.id);
      if (!schueler) {
        router.push('/teacher/klasse');
        return;
      }
      
      setSchueler(schueler);
      
      // Lade alle Sessions für diesen Schüler
      const alleSessions = (updatedKlasse as any).sessions || [];
      const schuelerSessions = alleSessions.filter((session: any) => 
        session.ergebnisse.some((erg: any) => erg.schuelerCode === schueler.code)
      );
      
      setSessions(schuelerSessions);
      
      // Analysiere die Ergebnisse
      await analyzeSchuelerResults(schuelerSessions, schueler.code);
      
    } catch (error) {
      console.error('Fehler beim Laden der Schülerdaten:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSchuelerResults = async (sessions: SessionResult[], schuelerCode: string) => {
    try {
      // Sammle alle Antworten des Schülers
      const alleAntworten = sessions.flatMap(session => 
        session.ergebnisse
          .filter(erg => erg.schuelerCode === schuelerCode)
          .flatMap(erg => erg.antworten)
      );

      if (alleAntworten.length === 0) {
        setAnalyse({
          schwaechen: ['Noch keine Daten verfügbar'],
          staerken: ['Noch keine Daten verfügbar'],
          empfehlungen: ['Führe erste Übungen durch, um eine Analyse zu erhalten'],
          gesamtPunkte: 0,
          durchschnittsZeit: 0,
          richtigeAntworten: 0,
          falscheAntworten: 0
        });
        return;
      }

      // Berechne Statistiken
      const richtigeAntworten = alleAntworten.filter(ant => ant.richtig || ant.korrekt).length;
      const falscheAntworten = alleAntworten.length - richtigeAntworten;
      const gesamtPunkte = sessions.reduce((sum, session) => {
        const erg = session.ergebnisse.find(e => e.schuelerCode === schuelerCode);
        return sum + (erg?.punkte || 0);
      }, 0);
      
      const durchschnittsZeit = sessions.reduce((sum, session) => {
        const erg = session.ergebnisse.find(e => e.schuelerCode === schuelerCode);
        return sum + (erg?.durchschnittsZeit || 0);
      }, 0) / sessions.length;

      // Analysiere Fehlertypen
      const fehlerAnalyse = analyzeFehlerTypen(alleAntworten);
      
      // OpenAI-Analyse (vereinfacht für Demo)
      const aiAnalyse = await getAIAnalyse(alleAntworten, fehlerAnalyse);

      setAnalyse({
        schwaechen: aiAnalyse.schwaechen,
        staerken: aiAnalyse.staerken,
        empfehlungen: aiAnalyse.empfehlungen,
        gesamtPunkte,
        durchschnittsZeit,
        richtigeAntworten,
        falscheAntworten
      });

    } catch (error) {
      console.error('Fehler bei der Analyse:', error);
      setAnalyse({
        schwaechen: ['Analyse fehlgeschlagen'],
        staerken: ['Analyse fehlgeschlagen'],
        empfehlungen: ['Bitte versuche es später erneut'],
        gesamtPunkte: 0,
        durchschnittsZeit: 0,
        richtigeAntworten: 0,
        falscheAntworten: 0
      });
    }
  };

  const analyzeFehlerTypen = (antworten: any[]) => {
    const fehler = antworten.filter(ant => !ant.richtig);
    const operationen = fehler.reduce((acc, ant) => {
      const op = ant.aufgabe.operation;
      acc[op] = (acc[op] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const reihen = fehler.reduce((acc, ant) => {
      const reihe = ant.aufgabe.reihe;
      acc[reihe] = (acc[reihe] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return { operationen, reihen };
  };

  const getAIAnalyse = async (antworten: any[], fehlerAnalyse: any): Promise<{schwaechen: string[], staerken: string[], empfehlungen: string[]}> => {
    // Vereinfachte Analyse ohne OpenAI für Demo
    // In der echten Implementierung würde hier die OpenAI API aufgerufen werden
    
    const richtigeAntworten = antworten.filter(ant => ant.richtig || ant.korrekt);
    const falscheAntworten = antworten.filter(ant => !(ant.richtig || ant.korrekt));
    
    const schwaechen = [];
    const staerken = [];
    const empfehlungen = [];

    // Analysiere Operationen
    const operationenFehler = fehlerAnalyse.operationen;
    const operationenRichtig = richtigeAntworten.reduce((acc, ant) => {
      const op = ant.aufgabe.operation;
      acc[op] = (acc[op] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(operationenFehler).forEach(([op, fehlerAnzahl]) => {
      const richtigAnzahl = operationenRichtig[op] || 0;
      const gesamt = (fehlerAnzahl as number) + richtigAnzahl;
      const fehlerRate = (fehlerAnzahl as number) / gesamt;
      
      if (fehlerRate > 0.3) {
        schwaechen.push(`${op.charAt(0).toUpperCase() + op.slice(1)} (${Math.round(fehlerRate * 100)}% Fehlerrate)`);
        empfehlungen.push(`Mehr Übung bei ${op.charAt(0).toUpperCase() + op.slice(1)}-Aufgaben`);
      } else if (fehlerRate < 0.1) {
        staerken.push(`${op.charAt(0).toUpperCase() + op.slice(1)} (${Math.round((1-fehlerRate) * 100)}% richtig)`);
      }
    });

    // Analysiere Reihen
    Object.entries(fehlerAnalyse.reihen).forEach(([reihe, fehlerAnzahl]) => {
      const reiheNum = parseInt(reihe);
      const richtigAnzahl = richtigeAntworten.filter(ant => ant.aufgabe.reihe === reiheNum).length;
      const gesamt = (fehlerAnzahl as number) + richtigAnzahl;
      const fehlerRate = (fehlerAnzahl as number) / gesamt;
      
      if (fehlerRate > 0.4) {
        schwaechen.push(`${reiheNum}er-Reihe (${Math.round(fehlerRate * 100)}% Fehlerrate)`);
        empfehlungen.push(`Spezielle Übung der ${reiheNum}er-Reihe`);
      }
    });

    // Zeitanalyse
    const durchschnittsZeit = antworten.reduce((sum, ant) => sum + (ant.zeit || 0), 0) / antworten.length;
    if (durchschnittsZeit > 10) {
      schwaechen.push('Langsame Bearbeitung');
      empfehlungen.push('Übung zur Steigerung der Rechengeschwindigkeit');
    } else if (durchschnittsZeit < 3) {
      staerken.push('Sehr schnelle Bearbeitung');
    }

    if (schwaechen.length === 0) {
      schwaechen.push('Keine besonderen Schwächen erkennbar');
    }
    if (staerken.length === 0) {
      staerken.push('Gleichmäßige Leistung in allen Bereichen');
    }
    if (empfehlungen.length === 0) {
      empfehlungen.push('Weiter so! Regelmäßige Übung beibehalten');
    }

    return { schwaechen, staerken, empfehlungen };
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Lade Schüler-Profil...</p>
        </div>
      </div>
    );
  }

  if (!schueler) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Schüler nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/teacher/klasse')}
            className="text-2xl hover:scale-110 transition-transform"
            title="Zurück zur Klasse"
          >
            ←
          </button>
          <div>
            <h1 className="text-4xl md:text-6xl font-bold">
              👤 {schueler.vorname}
            </h1>
            <p className="text-xl opacity-80">
              Code: {schueler.code} • {sessions.length} Übungen
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Statistiken */}
          <div className="space-y-6">
            <div className="kahoot-card">
              <h2 className="text-2xl font-bold mb-4">📊 Statistiken</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-kahoot-green">
                    {analyse?.richtigeAntworten || 0}
                  </div>
                  <div className="text-sm opacity-70">Richtige Antworten</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-kahoot-red">
                    {analyse?.falscheAntworten || 0}
                  </div>
                  <div className="text-sm opacity-70">Falsche Antworten</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-kahoot-blue">
                    {analyse?.gesamtPunkte || 0}
                  </div>
                  <div className="text-sm opacity-70">Gesamtpunkte</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-kahoot-purple">
                    {analyse?.durchschnittsZeit ? Math.round(analyse.durchschnittsZeit) : 0}s
                  </div>
                  <div className="text-sm opacity-70">Ø Zeit/Aufgabe</div>
                </div>
              </div>
            </div>

            {/* Schwächen */}
            <div className="kahoot-card">
              <h2 className="text-2xl font-bold mb-4 text-kahoot-red">⚠️ Schwächen</h2>
              <ul className="space-y-2">
                {analyse?.schwaechen.map((schwaeche, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-kahoot-red">•</span>
                    <span>{schwaeche}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stärken */}
            <div className="kahoot-card">
              <h2 className="text-2xl font-bold mb-4 text-kahoot-green">💪 Stärken</h2>
              <ul className="space-y-2">
                {analyse?.staerken.map((staerke, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-kahoot-green">•</span>
                    <span>{staerke}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Empfehlungen und Sessions */}
          <div className="space-y-6">
            {/* Empfehlungen */}
            <div className="kahoot-card">
              <h2 className="text-2xl font-bold mb-4 text-kahoot-blue">💡 Empfehlungen</h2>
              <ul className="space-y-2">
                {analyse?.empfehlungen.map((empfehlung, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-kahoot-blue">•</span>
                    <span>{empfehlung}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sessions */}
            <div className="kahoot-card">
              <h2 className="text-2xl font-bold mb-4">📚 Übungen</h2>
              {sessions.length === 0 ? (
                <p className="text-center opacity-70 py-8">
                  Noch keine Übungen durchgeführt
                </p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session, i) => {
                    const ergebnis = session.ergebnisse.find(erg => erg.schuelerCode === schueler.code);
                    if (!ergebnis) return null;
                    
                    return (
                      <motion.div
                        key={session.sessionId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/10 p-4 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                        onClick={() => router.push(`/teacher/schueler/${schueler.id}/session/${session.sessionId}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold">
                              {new Date(session.datum).toLocaleDateString('de-DE')}
                            </div>
                            <div className="text-sm opacity-70">
                              {session.settings.operationen.join(', ')} • {session.settings.anzahlAufgaben} Aufgaben
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-kahoot-green">
                              {ergebnis.punkte} Punkte
                            </div>
                            <div className="text-sm opacity-70">
                              {Math.round(ergebnis.durchschnittsZeit)}s Ø
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
