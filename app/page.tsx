'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600 text-white">
      {/* Skip to main content - Accessibility */}
      <a href="#main-content" className="skip-to-main">
        Zum Hauptinhalt springen
      </a>

      <motion.div
        id="main-content"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-4xl w-full"
      >
        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
          animate={{ 
            scale: [1, 1.02, 1],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🧮 Kopfrechnen
        </motion.h1>

        <p className="text-xl md:text-2xl mb-16 opacity-90 font-medium">
          Interaktives Live-Quiz • Lerne spielerisch rechnen
        </p>

        {/* Schüler Optionen - Hauptfokus */}
        <div className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Für Schüler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/student/code')}
              className="card-glass p-8 text-left hover:bg-white/20 transition-all touch-target"
            >
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">Mit Code beitreten</h3>
              <p className="text-sm opacity-80">Gib deinen Schüler-Code ein</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/student')}
              className="card-glass p-8 text-left hover:bg-white/20 transition-all touch-target"
            >
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="text-xl font-bold mb-2">Session beitreten</h3>
              <p className="text-sm opacity-80">Tritt einer Live-Session bei</p>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Lehrkraft Optionen - Dezent am unteren Rand */}
      <motion.div
        className="absolute bottom-6 left-0 right-0 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.5, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        whileHover={{ opacity: 1 }}
      >
        <div className="text-center max-w-md mx-auto">
          <p className="text-xs md:text-sm mb-3 opacity-70 font-medium">
            👨‍🏫 Für Lehrkräfte
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/auth/login')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-lg px-4 py-2 rounded-lg font-semibold text-sm transition-all border border-white/20 touch-target"
            >
              🔐 Mit Konto
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/teacher')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-lg px-4 py-2 rounded-lg font-semibold text-sm transition-all border border-white/20 touch-target"
            >
              👤 Gast-Modus
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
