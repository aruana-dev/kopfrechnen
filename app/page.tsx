'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
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

        <div className="space-y-8">
          {/* Lehrkraft Optionen */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Lehrkraft</h2>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/auth/login')}
                className="kahoot-button bg-kahoot-purple"
              >
                🔐 Mit Konto
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/teacher')}
                className="kahoot-button bg-kahoot-pink"
              >
                👨‍🏫 Gast-Modus
              </motion.button>
            </div>
          </div>

          {/* Schüler Optionen */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Schüler</h2>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/student/code')}
                className="kahoot-button bg-kahoot-blue"
              >
                🎯 Mit Code
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/student')}
                className="kahoot-button bg-kahoot-green"
              >
                🎓 Session beitreten
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 text-center"
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
