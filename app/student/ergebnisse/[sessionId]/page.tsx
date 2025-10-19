'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { jsonbin, SessionResult } from '@/lib/jsonbin';

export default function StudentSessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { activeKlasse } = useAuthStore();
  const [session, setSession] = useState<SessionResult | null>(null);
  const [ergebnis, setErgebnis] = useState<any>(null);
  const [schuelerCode, setSchuelerCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    const code = localStorage.getItem('schuelerCode');
    const nick = localStorage.getItem('schuelerNickname');
    
    if (!code || !nick) {
      router.push('/student/code');
      return;
    }
    
    setSchuelerCode(code);
    setNickname(nick);
    loadSessionData();
  }, [router, isHydrated, params.sessionId]);

  const loadSessionData = async () => {
    if (!params.sessionId) return;
    
    setLoading(true);
    try {
      const code = localStorage.getItem('schuelerCode');
      if (!code) return;

      // Lade Klasse direkt über jsonbin
      const result = await jsonbin.findKlasseBySchuelerCode(code);
      if (!result) {
        router.push('/student/code');
        return;
      }

      const { klasse } = result;
      
      // Finde die Session
      const session = klasse.sessions?.find(s => s.sessionId === params.sessionId);
      if (!session) {
        router.push('/student/ergebnisse');
        return;
      }
      
      setSession(session);
      
      // Finde das Ergebnis des Schülers
      const ergebnis = session.ergebnisse.find(erg => erg.schuelerCode === code);
      if (!ergebnis) {
        router.push('/student/ergebnisse');
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

  const getFehlerAnalyse = (antwort: any): string => {
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
          <p className="text-xl">Lade Übungsdetails...</p>
        </div>
      </div>
    );
  }

  if (!session || !ergebnis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Übung nicht gefunden</p>
      </div>
    );
  }

  const richtig = ergebnis.antworten.filter((a: any) => a.richtig).length;
  const gesamt = ergebnis.antworten.length;
  const richtigkeit = Math.round((richtig / gesamt) * 100);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/student/ergebnisse')}
            className="text-2xl hover:scale-110 transition-transform"
            title="Zurück zu den Ergebnissen"
          >
            ←
          </button>
          <div>
            <h1 className="text-4xl md:text-6xl font-bold">
              📚 Übung vom {new Date(session.datum).toLocaleDateString('de-DE')}
            </h1>
            <p className="text-xl opacity-80">
              {nickname} • {ergebnis.punkte} Punkte • {richtigkeit}% richtig
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
                {richtig}
              </div>
              <div className="text-sm opacity-70">Richtig</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-kahoot-red">
                {gesamt - richtig}
              </div>
              <div className="text-sm opacity-70">Falsch</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-kahoot-purple">
                {Math.round(ergebnis.gesamtZeit)}s
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
          <h2 className="text-2xl font-bold mb-6">📝 Deine Aufgaben und Antworten</h2>
          <div className="space-y-4">
            {ergebnis.antworten.map((antwort: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border-2 ${
                  antwort.richtig 
                    ? 'bg-green-500/20 border-green-500' 
                    : 'bg-red-500/20 border-red-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm opacity-70">Aufgabe #{index + 1}</div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      antwort.richtig 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {antwort.richtig ? '✓ Richtig' : '✗ Falsch'}
                    </div>
                    <div className="text-sm opacity-70">
                      {Math.round(antwort.zeit || 0)}s
                    </div>
                  </div>
                </div>
                
                <div className="text-xl font-bold mb-2">
                  {antwort.aufgabe.zahl1} {getOperationIcon(antwort.aufgabe.operation)} {antwort.aufgabe.zahl2} = ?
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-sm opacity-70 mb-1">Deine Antwort:</div>
                    <div className="text-lg font-mono bg-white/10 px-3 py-2 rounded">
                      {antwort.antwort}
                    </div>
                  </div>
                  
                  {!antwort.richtig && (
                    <div className="flex-1">
                      <div className="text-sm opacity-70 mb-1">Richtige Antwort:</div>
                      <div className="text-lg font-mono bg-green-500/20 px-3 py-2 rounded">
                        {antwort.aufgabe.ergebnis}
                      </div>
                    </div>
                  )}
                </div>
                
                {!antwort.richtig && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <div className="text-sm opacity-70">
                      <strong>Tipp:</strong> {getFehlerAnalyse(antwort)}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Motivations-Nachricht */}
        <div className="kahoot-card mt-8 text-center">
          <div className="text-4xl mb-4">
            {richtigkeit >= 90 ? '🏆' : richtigkeit >= 70 ? '🎉' : richtigkeit >= 50 ? '👍' : '💪'}
          </div>
          <h3 className="text-xl font-bold mb-2">
            {richtigkeit >= 90 ? 'Fantastisch!' : 
             richtigkeit >= 70 ? 'Gut gemacht!' : 
             richtigkeit >= 50 ? 'Weiter so!' : 
             'Übung macht den Meister!'}
          </h3>
          <p className="opacity-70 mb-4">
            {richtigkeit >= 90 ? 'Du bist ein Kopfrechen-Profi!' :
             richtigkeit >= 70 ? 'Du machst gute Fortschritte!' :
             richtigkeit >= 50 ? 'Mit etwas mehr Übung wirst du noch besser!' :
             'Jede Übung bringt dich weiter. Gib nicht auf!'}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/student/learn')}
            className="kahoot-button bg-kahoot-green"
          >
            🚀 Neue Übung starten
          </motion.button>
        </div>
      </div>
    </div>
  );
}
