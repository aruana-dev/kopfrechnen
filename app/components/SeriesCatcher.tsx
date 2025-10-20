'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SeriesCatcherProps {
  series: number; // z.B. 2, 3, 5, etc.
}

export default function SeriesCatcher({ series }: SeriesCatcherProps) {
  const [score, setScore] = useState(0);
  const [playerY, setPlayerY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [currentNumber, setCurrentNumber] = useState<number>(0);
  const [numberX, setNumberX] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const gameLoopRef = useRef<number>();
  const jumpTimeoutRef = useRef<NodeJS.Timeout>();

  // Generiere eine Zahl (50% Chance für richtige Reihe, 50% für falsche)
  const generateNumber = () => {
    const isCorrect = Math.random() > 0.5;
    if (isCorrect) {
      // Zahl aus der Reihe (1-12)
      const multiplier = Math.floor(Math.random() * 12) + 1;
      return series * multiplier;
    } else {
      // Falsche Zahl (aber nicht aus der Reihe)
      let number;
      do {
        number = Math.floor(Math.random() * 100) + 1;
      } while (number % series === 0);
      return number;
    }
  };

  // Sprung-Mechanik
  const jump = () => {
    if (isJumping) return;
    
    setIsJumping(true);
    
    // Sprung-Animation
    let jumpProgress = 0;
    const jumpInterval = setInterval(() => {
      jumpProgress += 0.05;
      if (jumpProgress <= 0.5) {
        // Hoch
        setPlayerY(-Math.sin(jumpProgress * Math.PI) * 150);
      } else if (jumpProgress <= 1) {
        // Runter
        setPlayerY(-Math.sin(jumpProgress * Math.PI) * 150);
      } else {
        clearInterval(jumpInterval);
        setPlayerY(0);
        setIsJumping(false);
      }
    }, 16);

    jumpTimeoutRef.current = setTimeout(() => {
      clearInterval(jumpInterval);
    }, 600);
  };

  // Kollisionserkennung
  const checkCollision = () => {
    // Wenn Spieler in der Luft ist und Zahl in der Nähe
    if (isJumping && numberX > 30 && numberX < 70) {
      const isCorrect = currentNumber % series === 0;
      
      if (isCorrect) {
        // Richtig!
        setScore(s => s + 1);
        setNumberX(100);
        setCurrentNumber(generateNumber());
      } else {
        // Falsch - Game Over
        setGameOver(true);
      }
    }
  };

  // Game Loop
  useEffect(() => {
    if (gameOver || showInstructions) return;

    const loop = () => {
      setNumberX(x => {
        const newX = x - 1;
        if (newX < -10) {
          return 100;
        }
        return newX;
      });
      
      checkCollision();
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isJumping, numberX, currentNumber, gameOver, showInstructions]);

  // Tastatur-Steuerung
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (showInstructions) {
          setShowInstructions(false);
          setCurrentNumber(generateNumber());
        } else if (gameOver) {
          // Neustart
          setGameOver(false);
          setScore(0);
          setNumberX(100);
          setCurrentNumber(generateNumber());
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showInstructions, gameOver, isJumping]);

  // Wenn Zahl aus dem Bildschirm ist, neue generieren
  useEffect(() => {
    if (numberX < -10) {
      setCurrentNumber(generateNumber());
    }
  }, [numberX]);

  if (showInstructions) {
    return (
      <div className="kahoot-card text-center">
        <h2 className="text-3xl font-bold mb-4">🎮 The Series Catcher</h2>
        <div className="text-6xl mb-4">🏃</div>
        <p className="text-xl mb-4">Fange nur Zahlen aus der <span className="font-bold text-kahoot-green">{series}er-Reihe</span>!</p>
        <p className="text-lg opacity-80 mb-6">Drücke <kbd className="bg-white/20 px-3 py-1 rounded">Leertaste</kbd> zum Springen</p>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-lg font-bold"
        >
          Drücke Leertaste zum Starten
        </motion.div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="kahoot-card text-center">
        <h2 className="text-3xl font-bold mb-4">💥 Game Over!</h2>
        <p className="text-xl mb-4">Du hast eine falsche Zahl gefangen!</p>
        <p className="text-2xl font-bold text-kahoot-yellow mb-6">Score: {score}</p>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-lg font-bold"
        >
          Drücke Leertaste für Neustart
        </motion.div>
      </div>
    );
  }

  return (
    <div className="kahoot-card">
      <div className="flex justify-between items-center mb-4">
        <div className="text-xl font-bold">
          🎯 {series}er-Reihe
        </div>
        <div className="text-2xl font-bold text-kahoot-yellow">
          ⭐ {score}
        </div>
      </div>

      {/* Spielfeld */}
      <div className="relative bg-gradient-to-b from-sky-400 to-green-300 rounded-xl overflow-hidden" style={{ height: '300px' }}>
        {/* Boden */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-green-600 to-green-700" />
        
        {/* Spieler (Indiana Jones Style) */}
        <motion.div
          className="absolute bottom-16 left-12 text-5xl"
          animate={{ y: playerY }}
          transition={{ type: 'spring', duration: 0.1 }}
        >
          🏃
        </motion.div>

        {/* Fallende Zahl */}
        <AnimatePresence>
          <motion.div
            key={currentNumber}
            className="absolute top-20 text-4xl font-bold bg-white/90 px-4 py-2 rounded-lg shadow-xl"
            style={{ left: `${numberX}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            {currentNumber}
          </motion.div>
        </AnimatePresence>

        {/* Wolken */}
        <div className="absolute top-4 left-10 text-3xl opacity-70">☁️</div>
        <div className="absolute top-8 right-20 text-2xl opacity-50">☁️</div>
        <div className="absolute top-12 left-1/2 text-4xl opacity-60">☁️</div>
      </div>

      <p className="text-center mt-4 text-sm opacity-70">
        Drücke <kbd className="bg-white/20 px-2 py-1 rounded">Leertaste</kbd> zum Springen
      </p>
    </div>
  );
}

