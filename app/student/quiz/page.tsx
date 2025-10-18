'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useSessionStore } from '@/store/useSessionStore';
import { getOperationSymbol } from '@/lib/aufgaben-generator';
import { jsonbin } from '@/lib/jsonbin';

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

    const handleSessionFinished = ({ rangliste }: any) => {
      console.log('Schüler: Session beendet Event empfangen, Rangliste:', rangliste);
      // Stats im Store setzen
      useSessionStore.getState().setStats({ teilnehmer: rangliste });
      router.push('/results');
    };

    socket.on('session-finished', handleSessionFinished);

    return () => {
      socket.off('session-finished', handleSessionFinished);
    };
  }, [socket, router]);

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
    const schuelerCode = localStorage.getItem('schuelerCode');
    const nickname = localStorage.getItem('schuelerNickname');
    
    if (!schuelerCode || !session) {
      console.log('❌ Kein Schüler-Code oder Session');
      isSavingRef.current = false;
      return;
    }

    // Prüfe ob diese Session schon gespeichert wurde
    const savedKey = `saved_session_${session.id}`;
    if (localStorage.getItem(savedKey)) {
      console.log('⚠️ Session bereits gespeichert, überspringe:', session.id);
      isSavingRef.current = false;
      router.push('/results');
      return;
    }

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

    // Speichere in JSONBin.io wenn Schüler-Code vorhanden
    try {
      console.log('🔍 Suche Klasse für Code:', schuelerCode);
      const result = await jsonbin.findKlasseBySchuelerCode(schuelerCode);
      
      if (result) {
        console.log('✅ Klasse gefunden, speichere jetzt...');
        
        const sessionResult = {
          sessionId: session.id,
          datum: Date.now(),
          settings: session.settings,
          ergebnisse: [{
            schuelerCode,
            nickname: nickname || 'Unbekannt',
            punkte,
            gesamtZeit: teilnehmer.gesamtZeit,
            durchschnittsZeit: teilnehmer.durchschnittsZeit,
            antworten: teilnehmer.antworten,
          }],
        };
        
        await jsonbin.saveSessionResult(result.binId, sessionResult);
        
        // Markiere Session als gespeichert
        localStorage.setItem(savedKey, 'true');
        
        console.log('✅ Solo-Ergebnis gespeichert in JSONBin.io für Session:', session.id);
      } else {
        console.log('❌ Keine Klasse gefunden für Code:', schuelerCode);
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  const progress = ((currentAufgabeIndex + 1) / session.aufgaben.length) * 100;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gradient-to-br from-kahoot-purple via-kahoot-blue to-kahoot-purple">
      <div className="flex-1 flex flex-col p-3 max-w-2xl mx-auto w-full">
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

        {/* Nummernpad - RESPONSIVE */}
        <div className="grid grid-cols-3 gap-2 mb-2 flex-shrink-0">
          {['7', '8', '9', '4', '5', '6', '1', '2', '3', '-', '0', '.'].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="aspect-square rounded-xl bg-gradient-to-br from-kahoot-blue to-kahoot-purple text-white font-bold text-2xl sm:text-3xl md:text-4xl shadow-xl active:scale-95 transition-transform touch-manipulation"
            >
              {num}
            </button>
          ))}
        </div>

        {/* Aktions-Buttons - nur wenn nicht Direkt-Weiter */}
        {!session?.settings.direktWeiter && (
          <div className="grid grid-cols-2 gap-2 flex-shrink-0">
            <button
              onClick={() => handleNumberClick('C')}
              className="py-3 rounded-xl bg-kahoot-red font-bold text-lg sm:text-xl active:scale-95 transition-transform shadow-lg"
            >
              Löschen
            </button>

            <button
              onClick={() => handleWeiter(false)}
              className="py-3 rounded-xl bg-kahoot-green font-bold text-lg sm:text-xl active:scale-95 transition-transform shadow-lg"
            >
              Weiter →
            </button>
          </div>
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
