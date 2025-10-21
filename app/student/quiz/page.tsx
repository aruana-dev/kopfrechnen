'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useSessionStore } from '@/store/useSessionStore';
import { useServerAuthStore } from '@/store/useServerAuthStore';
import { getOperationSymbol } from '@/lib/aufgaben-generator';

export default function StudentQuiz() {
  const router = useRouter();
  const { socket } = useSocket();
  const { session, currentAufgabeIndex, setCurrentAufgabeIndex, startzeit, setStartzeit } = useSessionStore();
  
  const [antwort, setAntwort] = useState('');
  const [aufgabeStartzeit, setAufgabeStartzeit] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const isSavingRef = useRef(false); // Verhindere Mehrfach-Speicherung mit Ref statt State
  const savedSessionsRef = useRef<Set<string>>(new Set()); // Track gespeicherte Sessions

  const currentAufgabe = session?.aufgaben[currentAufgabeIndex];
  const hasTempoLimit = session?.settings.tempo.vorgegeben;
  const tempoSekunden = session?.settings.tempo.sekunden || 0;

  useEffect(() => {
    if (!startzeit) {
      setStartzeit(Date.now());
    }
  }, [startzeit, setStartzeit]);

  // Tastatur-Unterstützung
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Verhindere Standard-Verhalten
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '.', ','].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key >= '0' && e.key <= '9') {
        handleNumberClick(e.key);
      } else if (e.key === '-' || e.key === '_') {
        handleNumberClick('-');
      } else if (e.key === '.' || e.key === ',') {
        handleNumberClick('.');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleNumberClick('⌫');
      } else if (e.key === 'Delete' || e.key === 'Escape') {
        e.preventDefault();
        handleNumberClick('C');
      } else if (e.key === 'Enter' && !session?.settings.direktWeiter) {
        e.preventDefault();
        handleWeiter(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [antwort, session, currentAufgabe]);

  // Timer für vorgegebenes Tempo
  useEffect(() => {
    if (!hasTempoLimit || !currentAufgabe) return;

    // NUR Timer setzen, NICHT die aufgabeStartzeit überschreiben!
    setTimeLeft(tempoSekunden * 1000);
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = (tempoSekunden * 1000) - elapsed;
      
      if (remaining <= 0) {
        handleWeiter(true); // Auto-submit
      } else {
        setTimeLeft(remaining);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [currentAufgabeIndex, hasTempoLimit, tempoSekunden]);

  // Setze aufgabeStartzeit beim Aufgabenwechsel
  useEffect(() => {
    setAufgabeStartzeit(Date.now());
    console.log('🔄 Neue Aufgabe:', currentAufgabeIndex + 1, 'Startzeit gesetzt');
  }, [currentAufgabeIndex]);

  useEffect(() => {
    if (!socket) return;

    const handleSessionFinished = async ({ rangliste, sessionId, aufgaben }: any) => {
      console.log('Schüler: Session beendet Event empfangen, Rangliste:', rangliste);
      
      // Stats im Store setzen
      useSessionStore.getState().setStats({ teilnehmer: rangliste });
      
      // Wenn Schüler eingeloggt ist, speichere die Session
      const { schueler } = useServerAuthStore.getState();
      if (schueler && sessionId) {
        console.log('💾 Speichere Multiplayer-Session für:', schueler.nickname);
        
        // Finde meine Daten in der Rangliste
        const meinErgebnis = rangliste.find((r: any) => r.name === (schueler.nickname || schueler.vorname));
        
        if (meinErgebnis) {
          try {
            // Baue Antworten-Array auf (aus Session-Store)
            const teilnehmer = session?.teilnehmer.find((t: any) => t.name === (schueler.nickname || schueler.vorname));
            
            const response = await fetch('/api/sessions/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                schuelerCode: schueler.code,
                nickname: schueler.nickname || schueler.vorname,
                punkte: meinErgebnis.punkte,
                gesamtZeit: meinErgebnis.gesamtZeit,
                durchschnittsZeit: meinErgebnis.durchschnittsZeit,
                antworten: teilnehmer?.antworten || [],
                aufgaben: aufgaben || session?.aufgaben || []
              })
            });
            
            if (response.ok) {
              console.log('✅ Multiplayer-Session gespeichert');
            } else {
              console.log('❌ Fehler beim Speichern:', await response.text());
            }
          } catch (error) {
            console.error('❌ Fehler beim Speichern:', error);
          }
        }
      }
      
      router.push('/results');
    };

    socket.on('session-finished', handleSessionFinished);

    return () => {
      socket.off('session-finished', handleSessionFinished);
    };
  }, [socket, router, session]);

  const handleNumberClick = (num: string) => {
    if (num === 'C') {
      setAntwort('');
    } else if (num === '⌫') {
      setAntwort(antwort.slice(0, -1));
    } else if (num === '-' && antwort === '') {
      setAntwort('-');
    } else if (num === '.' && !antwort.includes('.')) {
      setAntwort(antwort + '.');
    } else if (num >= '0' && num <= '9') {
      const neueAntwort = antwort + num;
      setAntwort(neueAntwort);
      
      // Direkt weiter, wenn aktiviert und genug Stellen eingegeben
      if (session?.settings.direktWeiter && currentAufgabe) {
        const ergebnisStellen = Math.abs(currentAufgabe.ergebnis).toString().replace('.', '').length;
        const eingabeStellen = neueAntwort.replace('-', '').replace('.', '').length;
        
        if (eingabeStellen >= ergebnisStellen) {
          // Kurz warten, damit der User die Eingabe sieht
          setTimeout(() => handleWeiter(true), 300);
        }
      }
    }
  };

  const handleWeiter = async (autoSubmit = false) => {
    if (!session || !currentAufgabe) return;

    const zeit = Date.now() - aufgabeStartzeit;
    const antwortWert = antwort === '' || antwort === '-' ? 0 : parseFloat(antwort);
    const korrekt = Math.abs(antwortWert - currentAufgabe.ergebnis) < 0.01;

    console.log('📝 Antwort:', antwortWert, 'Ergebnis:', currentAufgabe.ergebnis, 'Korrekt:', korrekt, 'Zeit:', zeit, 'ms');

    // Solo-Modus (Selbst-Lernen)?
    const isSoloMode = session.teilnehmer.length === 1 && session.teilnehmer[0].id === 'self';

    if (isSoloMode) {
      // Solo-Modus: Session im Store aktualisieren
      const updatedSession = { ...session };
      const teilnehmer = { ...updatedSession.teilnehmer[0] };
      
      const neueAntwort = {
        aufgabeId: currentAufgabe.id,
        antwort: antwortWert,
        korrekt,
        zeit,
      };

      teilnehmer.antworten = [...teilnehmer.antworten, neueAntwort];
      teilnehmer.gesamtZeit += zeit;
      teilnehmer.durchschnittsZeit = teilnehmer.gesamtZeit / teilnehmer.antworten.length;

      updatedSession.teilnehmer = [teilnehmer];
      useSessionStore.getState().setSession(updatedSession);

      console.log('✅ Solo-Antwort gespeichert:', {
        korrekt,
        gesamtAntworten: teilnehmer.antworten.length,
        richtigeAntworten: teilnehmer.antworten.filter((a: any) => a.korrekt).length,
        gesamtZeit: teilnehmer.gesamtZeit,
      });

      if (currentAufgabeIndex < session.aufgaben.length - 1) {
        setCurrentAufgabeIndex(currentAufgabeIndex + 1);
        setAntwort('');
        setAufgabeStartzeit(Date.now());
      } else {
        // Letzte Aufgabe - zeige Ergebnis direkt
        if (!isSavingRef.current && !savedSessionsRef.current.has(session.id)) {
          isSavingRef.current = true;
          savedSessionsRef.current.add(session.id);
          await saveSoloResult(teilnehmer);
          // Navigation passiert in saveSoloResult nach erfolgreichem Speichern
        }
      }
    } else {
      // Multi-Player-Modus: Socket verwenden
      if (!socket) return;

      socket.emit('submit-antwort', {
        sessionId: session.id,
        aufgabeId: currentAufgabe.id,
        antwort: antwortWert,
        zeit,
      });

      if (currentAufgabeIndex < session.aufgaben.length - 1) {
        setCurrentAufgabeIndex(currentAufgabeIndex + 1);
        setAntwort('');
        setAufgabeStartzeit(Date.now());
      } else {
        // Letzte Aufgabe - warte auf andere
        router.push('/student/waiting');
      }
    }
  };

  const saveSoloResult = async (teilnehmer: any) => {
    const { schueler } = useServerAuthStore.getState();
    
    if (!schueler || !session) {
      console.log('❌ Kein Schüler eingeloggt oder Session');
      isSavingRef.current = false;
      return;
    }

    const schuelerCode = schueler.code;
    const nickname = schueler.nickname;

    const punkte = teilnehmer.antworten.filter((a: any) => a.korrekt).length;
    
    console.log('💾 Speichere Solo-Ergebnis (Session:', session.id, '):', {
      anzahlAntworten: teilnehmer.antworten.length,
      davonKorrekt: punkte,
      gesamtZeit: teilnehmer.gesamtZeit,
      durchschnittsZeit: teilnehmer.durchschnittsZeit,
    });
    
    // Erstelle Rangliste für Stats
    const rangliste = [{
      id: 'self',
      name: nickname || 'Du',
      punkte,
      gesamtZeit: teilnehmer.gesamtZeit,
      durchschnittsZeit: teilnehmer.durchschnittsZeit,
    }];

    console.log('📊 Setze Stats im Store');
    useSessionStore.getState().setStats({ teilnehmer: rangliste });

    // Speichere über API Route
    try {
      console.log('💾 Speichere Ergebnis für Code:', schuelerCode);
      
      const response = await fetch('/api/sessions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          schuelerCode,
          nickname: nickname || 'Unbekannt',
          punkte,
          gesamtZeit: teilnehmer.gesamtZeit,
          durchschnittsZeit: teilnehmer.durchschnittsZeit,
          antworten: teilnehmer.antworten,
          aufgaben: session.aufgaben
        })
      });
      
      if (response.ok) {
        console.log('✅ Solo-Ergebnis gespeichert für Session:', session.id);
      } else {
        console.log('❌ Fehler beim Speichern:', await response.text());
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
    } finally {
      isSavingRef.current = false;
      // Navigation erst NACH dem Speichern
      router.push('/results');
    }
  };

  if (!session || !currentAufgabe) {
    return (
      <div data-role="student" className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  const progress = ((currentAufgabeIndex + 1) / session.aufgaben.length) * 100;

  const handleAbbrechen = () => {
    if (confirm('Quiz wirklich abbrechen? Der Fortschritt geht verloren.')) {
      const isSoloMode = session.teilnehmer.length === 1 && session.teilnehmer[0].id === 'self';
      
      if (isSoloMode) {
        // Solo: Zurück zum Dashboard
        useSessionStore.getState().reset();
        router.push('/student/dashboard');
      } else {
        // Multi-Player: Zurück zur Startseite
        useSessionStore.getState().reset();
        router.push('/');
      }
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gradient-to-br from-kahoot-purple via-kahoot-blue to-kahoot-purple">
      <div className="flex-1 flex flex-col p-3 max-w-2xl mx-auto w-full">
        {/* Abbrechen Button */}
        <button
          onClick={handleAbbrechen}
          className="absolute top-4 left-4 z-50 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-bold text-sm transition-all"
        >
          ✖️ Abbrechen
        </button>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-2 mb-2 overflow-hidden flex-shrink-0">
          <motion.div
            className="h-full bg-gradient-to-r from-kahoot-green to-kahoot-blue"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>

        {/* Timer */}
        {hasTempoLimit && timeLeft !== null && (
          <div className="text-center mb-2 flex-shrink-0">
            <motion.p
              className="text-2xl font-bold"
              animate={{ 
                scale: timeLeft < 1000 ? [1, 1.1, 1] : 1,
                color: timeLeft < 1000 ? '#e21b3c' : '#ffffff'
              }}
              transition={{ duration: 0.3 }}
            >
              ⏱️ {(timeLeft / 1000).toFixed(1)}s
            </motion.p>
          </div>
        )}

        {/* Aufgaben-Info */}
        <div className="text-center mb-2 flex-shrink-0">
          <p className="text-sm opacity-80">
            Aufgabe {currentAufgabeIndex + 1} von {session.aufgaben.length}
          </p>
        </div>

        {/* Aufgabe - GROSS UND DEUTLICH */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAufgabe.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 mb-3 flex-shrink-0 border-2 border-white/30"
          >
            <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-center text-white">
              {currentAufgabe.zahl1} {getOperationSymbol(currentAufgabe.operation)} {currentAufgabe.zahl2}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Antwort Display */}
        <div className="bg-white text-kahoot-purple rounded-xl p-4 mb-3 flex-shrink-0">
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-center min-h-[1.2em]">
            {antwort || '_'}
          </p>
        </div>

        {/* Nummernpad - HALBE BILDSCHIRMHÖHE */}
        <div className="grid grid-cols-3 gap-2 mb-2 flex-shrink-0 w-full" style={{ height: '50vh', maxHeight: '400px' }}>
          {['7', '8', '9', '4', '5', '6', '1', '2', '3', '-', '0', '.'].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="rounded-xl bg-gradient-to-br from-kahoot-blue to-kahoot-purple text-white font-bold text-3xl sm:text-4xl md:text-5xl shadow-xl active:scale-95 transition-transform touch-manipulation flex items-center justify-center"
            >
              {num}
            </button>
          ))}
        </div>

        {/* Aktions-Button - nur wenn nicht Direkt-Weiter */}
        {!session?.settings.direktWeiter && (
          <button
            onClick={() => handleWeiter(false)}
            className="py-3 rounded-xl bg-kahoot-green font-bold text-lg sm:text-xl active:scale-95 transition-transform shadow-lg w-full flex-shrink-0"
          >
            Weiter →
          </button>
        )}
        
        {session?.settings.direktWeiter && (
          <p className="text-center text-sm opacity-70 flex-shrink-0">
            ⚡ Auto-Weiter • Tastatur OK
          </p>
        )}
      </div>
    </div>
  );
}
