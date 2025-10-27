'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useServerAuthStore } from '@/store/useServerAuthStore';
import { Schueler, SessionResult } from '@/lib/jsonbin';

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { lehrer, activeKlasse } = useServerAuthStore();
  const [schueler, setSchueler] = useState<Schueler | null>(null);
  const [session, setSession] = useState<SessionResult | null>(null);
  const [ergebnis, setErgebnis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!lehrer || !activeKlasse) {
      router.push('/teacher/dashboard');
      return;
    }

    loadSessionData();
  }, [lehrer, activeKlasse, router, isHydrated, params.id, params.sessionId]);

  const loadSessionData = async () => {
    if (!activeKlasse || !params.id || !params.sessionId) return;
    
    setLoading(true);
    try {
      // Lade aktuelle Klassendaten via API
      const response = await fetch(`/api/klasse/${activeKlasse.id}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Fehler beim Laden:', data.error);
        router.push('/teacher/klasse');
        return;
      }

      const updatedKlasse = data.klasse;
      
      // Finde den Schüler
      const schueler = updatedKlasse.schueler?.find((s: any) => s.id === params.id);
      if (!schueler) {
        router.push('/teacher/klasse');
        return;
      }
      
      setSchueler(schueler);
      
      // Finde die Session
      const session = updatedKlasse.sessions?.find((s: any) => s.sessionId === params.sessionId);
      if (!session) {
        router.push(`/teacher/schueler/${params.id}`);
        return;
      }
      
      setSession(session);
      
      // Finde das Ergebnis des Schülers
      const ergebnis = session.ergebnisse.find((erg: any) => erg.schuelerCode === schueler.code);
      if (!ergebnis) {
        router.push(`/teacher/schueler/${params.id}`);
        return;
      }
      
      setErgebnis(ergebnis);
      
    } catch (error) {
      console.error('Fehler beim Laden der Session-Daten:', error);
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
      <div data-role="teacher" className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div data-role="teacher" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Lade Session-Details...</p>
        </div>
      </div>
    );
  }

  if (!schueler || !session || !ergebnis) {
    return (
      <div data-role="teacher" className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Session nicht gefunden</p>
      </div>
    );
  }

  return (
    <div data-role="teacher" className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/teacher/schueler/${params.id}`)}
            className="text-2xl hover:scale-110 transition-transform"
            title="Zurück zum Schüler-Profil"
          >
            ←
          </button>
          <div>
            <h1 className="text-4xl md:text-6xl font-bold">
              📚 Übung vom {new Date(session.datum).toLocaleDateString('de-DE')}
            </h1>
            <p className="text-xl opacity-80">
              {schueler.vorname} • {ergebnis.punkte} Punkte • {(ergebnis.durchschnittsZeit / 1000).toFixed(1)}s Ø
            </p>
          </div>
        </div>

        {/* Session-Info */}
        <div className="kahoot-card mb-8">
          <h2 className="text-2xl font-bold mb-4">📋 Übungsdetails</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-kahoot-blue">
                {session.settings.anzahlAufgaben}
              </div>
              <div className="text-sm opacity-70">Aufgaben</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-kahoot-green">
                {ergebnis.antworten.filter((a: any) => a.richtig).length}
              </div>
              <div className="text-sm opacity-70">Richtig</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-kahoot-red">
                {ergebnis.antworten.filter((a: any) => !a.richtig).length}
              </div>
              <div className="text-sm opacity-70">Falsch</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-kahoot-purple">
                {(ergebnis.gesamtZeit / 1000).toFixed(1)}s
              </div>
              <div className="text-sm opacity-70">Gesamtzeit</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Operationen:</strong> {session.settings.operationen.map(getOperationName).join(', ')}
              </div>
              <div>
                <strong>Reihen:</strong> {session.settings.reihen.join(', ')}
              </div>
              <div>
                <strong>Stellen:</strong> {session.settings.anzahlStellen}
              </div>
              <div>
                <strong>Kommastellen:</strong> {session.settings.mitKommastellen ? 'Ja' : 'Nein'}
              </div>
            </div>
          </div>
        </div>

        {/* Aufgaben */}
        <div className="kahoot-card">
          <h2 className="text-2xl font-bold mb-6">📝 Aufgaben und Antworten</h2>
          <div className="space-y-4">
            {ergebnis.antworten.map((antwort: any, index: number) => {
              const istRichtig = antwort.richtig || antwort.korrekt;
              const aufgabe = antwort.aufgabe;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border-2 ${
                    istRichtig 
                      ? 'bg-green-500/20 border-green-500' 
                      : 'bg-red-500/20 border-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm opacity-70">Aufgabe #{index + 1}</div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        istRichtig 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {istRichtig ? '✓ Richtig' : '✗ Falsch'}
                      </div>
                      <div className="text-sm opacity-70">
                        {Math.round(antwort.zeit || 0)}s
                      </div>
                    </div>
                  </div>
                  
                  {aufgabe ? (
                    <>
                      <div className="text-xl font-bold mb-2">
                        {aufgabe.zahl1} {getOperationIcon(aufgabe.operation)} {aufgabe.zahl2} = ?
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="text-sm opacity-70 mb-1">Antwort:</div>
                          <div className="text-lg font-mono bg-white/10 px-3 py-2 rounded">
                            {antwort.antwort}
                          </div>
                        </div>
                        
                        {!istRichtig && (
                          <div className="flex-1">
                            <div className="text-sm opacity-70 mb-1">Richtige Antwort:</div>
                            <div className="text-lg font-mono bg-green-500/20 px-3 py-2 rounded">
                              {aufgabe.ergebnis}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {!istRichtig && (
                        <div className="mt-3 pt-3 border-t border-white/20">
                          <div className="text-sm opacity-70">
                            <strong>Fehleranalyse:</strong> {getFehlerAnalyse(antwort)}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-lg opacity-70">
                      Aufgabe-Details nicht verfügbar
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function getFehlerAnalyse(antwort: any): string {
  const antwortNum = parseFloat(antwort.antwort);
  const richtigeAntwort = antwort.aufgabe.ergebnis;
  
  if (isNaN(antwortNum)) {
    return "Keine gültige Zahl eingegeben";
  }
  
  const differenz = Math.abs(antwortNum - richtigeAntwort);
  const prozentAbweichung = (differenz / richtigeAntwort) * 100;
  
  if (prozentAbweichung < 5) {
    return "Sehr nah dran! Kleiner Rechenfehler.";
  } else if (prozentAbweichung < 20) {
    return "Teilweise richtig, aber größerer Fehler.";
  } else if (prozentAbweichung < 50) {
    return "Deutlicher Rechenfehler.";
  } else {
    return "Komplett falsche Lösung.";
  }
}
