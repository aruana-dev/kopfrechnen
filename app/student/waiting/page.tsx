'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { sessionAPI } from '@/hooks/usePolling';
import { useSessionStore } from '@/store/useSessionStore';

export default function StudentWaiting() {
  const router = useRouter();
  const { session, setSession } = useSessionStore();
  
  // Mini-Game State
  const [gameActive, setGameActive] = useState(true);
  const [score, setScore] = useState(0);
  const [playerY, setPlayerY] = useState(300); // Höhe des Spielers
  const [isJumping, setIsJumping] = useState(false);
  const [numbers, setNumbers] = useState<Array<{ id: number; x: number; y: number; value: number; isCorrect: boolean }>>([]);
  const [targetSeries, setTargetSeries] = useState<number[]>([]);
  const [targetReihe, setTargetReihe] = useState<number>(0);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [shake, setShake] = useState(false);

  // Generiere Ziel-Reihe aus den Session-Settings (NUR EINMAL!)
  useEffect(() => {
    if (session?.settings?.reihen && session.settings.reihen.length > 0 && targetSeries.length === 0) {
      // Wähle eine zufällige Reihe (bleibt für die gesamte Session gleich)
      const randomReihe = session.settings.reihen[Math.floor(Math.random() * session.settings.reihen.length)];
      setTargetReihe(randomReihe);
      // Generiere die ersten 15 Zahlen der Reihe
      const series = Array.from({ length: 15 }, (_, i) => (i + 1) * randomReihe);
      setTargetSeries(series);
      console.log('🎯 Ziel-Reihe:', randomReihe, 'er Reihe');
    }
  }, [session, targetSeries.length]);

  // Polling für Session-Updates
  useEffect(() => {
    if (!session) {
      router.push('/student');
      return;
    }

    const pollInterval = setInterval(async () => {
      const updatedSession = await sessionAPI.getSessionByCode(session.code);
      
      if (updatedSession) {
        setSession(updatedSession);

        if (updatedSession.status === 'finished') {
          // Berechne Rangliste und setze Stats
          const rangliste = updatedSession.teilnehmer
            .map((t: any) => ({
              id: t.id,
              name: t.name,
              punkte: t.antworten.filter((a: any) => a.korrekt).length,
              gesamtZeit: t.gesamtZeit,
              durchschnittsZeit: t.durchschnittsZeit,
            }))
            .sort((a: any, b: any) => 
              b.punkte !== a.punkte ? b.punkte - a.punkte : a.gesamtZeit - b.gesamtZeit
            );
          
          useSessionStore.getState().setStats({ teilnehmer: rangliste });
          console.log('📊 Stats gesetzt, navigiere zu Results');
          
          // Session ist beendet, zur Ergebnis-Seite
          router.push('/results');
        }
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [session, router, setSession]);

  // Sprung-Mechanik
  useEffect(() => {
    if (!isJumping) return;

    let jumpHeight = 0;
    const jumpInterval = setInterval(() => {
      jumpHeight += 20;
      
      if (jumpHeight <= 150) {
        // Aufwärts
        setPlayerY(prev => Math.max(150, prev - 20));
      } else if (jumpHeight <= 300) {
        // Abwärts
        setPlayerY(prev => Math.min(300, prev + 20));
      } else {
        // Landung
        setPlayerY(300);
        setIsJumping(false);
        clearInterval(jumpInterval);
      }
    }, 30);

    return () => clearInterval(jumpInterval);
  }, [isJumping]);

  // Zahlen generieren und bewegen
  useEffect(() => {
    if (!gameActive || targetSeries.length === 0) return;

    // Neue Zahl alle 2 Sekunden
    const spawnInterval = setInterval(() => {
      const isCorrect = Math.random() > 0.3; // 70% richtige Zahlen
      const value = isCorrect 
        ? targetSeries[Math.floor(Math.random() * targetSeries.length)]
        : Math.floor(Math.random() * 100) + 1;
      
      setNumbers(prev => [
        ...prev,
        {
          id: Date.now(),
          x: 800, // Start rechts
          y: 150 + Math.random() * 100, // Zufällige Höhe
          value,
          isCorrect
        }
      ]);
    }, 2000);

    // Zahlen bewegen
    const moveInterval = setInterval(() => {
      setNumbers(prev => 
        prev
          .map(num => ({ ...num, x: num.x - 5 }))
          .filter(num => num.x > -50) // Entferne Zahlen, die aus dem Bildschirm sind
      );
    }, 50);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(moveInterval);
    };
  }, [gameActive, targetSeries]);

  // Kollisionserkennung
  useEffect(() => {
    if (!gameActive) return;

    const checkCollisions = () => {
      numbers.forEach(num => {
        // Spieler ist bei x=100, prüfe ob Zahl in der Nähe ist
        if (num.x >= 80 && num.x <= 120 && Math.abs(num.y - playerY) < 50) {
          if (num.isCorrect) {
            // Richtige Zahl gefangen! +1 Punkt
            setScore(prev => prev + 1);
            setNumbers(prev => prev.filter(n => n.id !== num.id));
            
            // Zeige grünes Häkchen
            setShowFeedback('correct');
            setTimeout(() => setShowFeedback(null), 500);
          } else {
            // Falsche Zahl gefangen! -1 Punkt (aber nicht unter 0)
            setScore(prev => Math.max(0, prev - 1));
            setNumbers(prev => prev.filter(n => n.id !== num.id));
            
            // Zeige rotes X und schüttle Screen
            setShowFeedback('wrong');
            setShake(true);
            setTimeout(() => {
              setShowFeedback(null);
              setShake(false);
            }, 500);
          }
        }
      });
    };

    const collisionInterval = setInterval(checkCollisions, 50);
    return () => clearInterval(collisionInterval);
  }, [numbers, playerY, gameActive]);

  // Tastatur-Events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isJumping && gameActive) {
        setIsJumping(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isJumping, gameActive]);

  if (!session) {
    return (
      <div data-role="student" className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  const fertigueTeilnehmer = session.teilnehmer.filter(
    (t: any) => t.antworten.length === session.aufgaben.length
  );

  return (
    <div data-role="student" className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">🎉 Super! Du bist fertig!</h1>
        <p className="text-xl mb-4">
          {fertigueTeilnehmer.length} / {session.teilnehmer.length} fertig
        </p>
        
        {/* Mini-Game Anleitung */}
        {targetReihe > 0 && (
          <div className="kahoot-card inline-block mb-4">
            <p className="text-lg font-bold">🎮 The Series Catcher</p>
            <p className="text-6xl font-bold my-4 text-kahoot-blue">{targetReihe}er Reihe</p>
            <p className="text-sm">Fange nur Zahlen aus dieser Reihe!</p>
            <p className="text-xs mt-2 opacity-70">Drücke LEERTASTE zum Springen</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-sm opacity-70">Deine Punkte:</p>
              <p className="text-4xl font-bold text-kahoot-green">{score}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Mini-Game Canvas */}
      <div className={`relative w-full max-w-4xl h-96 bg-gradient-to-b from-blue-400 to-green-400 rounded-2xl overflow-hidden border-4 border-white/30 shadow-2xl transition-transform ${shake ? 'animate-shake' : ''}`}>
        {/* Boden */}
        <div className="absolute bottom-0 w-full h-20 bg-amber-800" />
        
        {/* Spieler (Indiana Jones Style) */}
        <motion.div
          className="absolute text-6xl"
          style={{ 
            left: '100px', 
            top: `${playerY}px`,
            transition: 'top 0.1s ease-out'
          }}
          animate={{
            rotate: isJumping ? -15 : 0,
          }}
        >
          🤠
        </motion.div>

        {/* Zahlen */}
        {numbers.map(num => (
          <motion.div
            key={num.id}
            className={`absolute text-4xl font-bold px-4 py-2 rounded-xl ${
              num.isCorrect 
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/50' 
                : 'bg-red-500 text-white shadow-lg shadow-red-500/50'
            }`}
            style={{
              left: `${num.x}px`,
              top: `${num.y}px`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {num.value}
          </motion.div>
        ))}

        {/* Reihen-Anzeige im Spiel - GROß */}
        {targetReihe > 0 && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-2xl border-4 border-kahoot-blue">
            <p className="text-xs font-bold text-gray-600 mb-1">ZIEL-REIHE</p>
            <p className="text-5xl font-black text-kahoot-blue">
              {targetReihe}er
            </p>
          </div>
        )}
        
        {/* Feedback Overlay */}
        {showFeedback === 'correct' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="text-9xl drop-shadow-2xl">✅</div>
          </motion.div>
        )}
        
        {showFeedback === 'wrong' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="text-9xl drop-shadow-2xl">❌</div>
          </motion.div>
        )}
      </div>

      {/* Fortschrittsbalken */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="kahoot-card w-full max-w-md mt-8"
      >
        <p className="text-center mb-2">Warte auf die anderen...</p>
        <div className="w-full bg-white/20 rounded-full h-4">
          <motion.div
            className="bg-kahoot-green h-4 rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${(fertigueTeilnehmer.length / session.teilnehmer.length) * 100}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>
    </div>
  );
}
