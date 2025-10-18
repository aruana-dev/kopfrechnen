'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.h1
          className="text-6xl md:text-8xl font-bold mb-8"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🧮 Kopfrechnen
        </motion.h1>

        <p className="text-2xl mb-12 opacity-90">
          Interaktives Live-Quiz wie Kahoot!
        </p>

        {/* Schüler Optionen - Hauptfokus */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Schüler</h2>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/student/code')}
              className="kahoot-button bg-kahoot-blue text-2xl px-12 py-6"
            >
              🎯 Mit Code beitreten
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/student')}
              className="kahoot-button bg-kahoot-green text-2xl px-12 py-6"
            >
              🎓 Session beitreten
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Lehrkraft Optionen - Versteckt am unteren Rand */}
      <motion.div
        className="absolute bottom-8 left-0 right-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        whileHover={{ opacity: 1 }}
      >
        <div className="text-center">
          <p className="text-sm mb-4 opacity-80">
            Für Lehrkräfte
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/auth/login')}
              className="kahoot-button bg-kahoot-purple text-sm px-4 py-2"
            >
              🔐 Mit Konto
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/teacher')}
              className="kahoot-button bg-kahoot-pink text-sm px-4 py-2"
            >
              👨‍🏫 Gast-Modus
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-24 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1 }}
      >
        <p className="text-sm">
          Ähnlich wie Kahoot - aber für Kopfrechnen!
        </p>
      </motion.div>
    </div>
  );
}
