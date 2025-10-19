'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useServerAuthStore } from '@/store/useServerAuthStore';
import { jsonbin, Klasse } from '@/lib/jsonbin';

export default function TeacherDashboard() {
  const router = useRouter();
  const { lehrer, logoutLehrer, setActiveKlasse } = useServerAuthStore();
  const [klassen, setKlassen] = useState<Klasse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKlasse, setShowNewKlasse] = useState(false);
  const [newKlasseName, setNewKlasseName] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  // Warte auf Hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!lehrer) {
      console.log('⚠️ Kein Lehrer im Store, leite zu Login um');
      router.push('/auth/login');
      return;
    }
    
    console.log('✅ Lehrer im Store gefunden:', lehrer.username);
    loadKlassen();
  }, [lehrer, router, isHydrated]);

  const loadKlassen = async () => {
    if (!lehrer) return;
    setLoading(true);
    try {
      const klassenData: Klasse[] = [];
      for (const klasseId of lehrer.klassen) {
        const klasse = await jsonbin.readBin(klasseId);
        if (klasse) klassenData.push({ ...klasse, id: klasseId });
      }
      setKlassen(klassenData);
    } catch (error) {
      console.error('Fehler beim Laden der Klassen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKlasse = async () => {
    if (!lehrer || !newKlasseName) return;
    
    try {
      const klasse = await jsonbin.createKlasse(lehrer.id, newKlasseName);
      
      // Klasse zur Lehrer-Liste hinzufügen
      const updatedTeacher = {
        ...lehrer,
        klassen: [...lehrer.klassen, klasse.id],
      };
      await jsonbin.updateBin(lehrer.id, updatedTeacher);
      
      setKlassen([...klassen, klasse]);
      setNewKlasseName('');
      setShowNewKlasse(false);
    } catch (error) {
      console.error('Fehler beim Erstellen der Klasse:', error);
    }
  };

  const handleSelectKlasse = (klasse: Klasse) => {
    setActiveKlasse(klasse);
    router.push('/teacher/klasse');
  };

  if (!isHydrated || !lehrer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Dashboard
            </h1>
            <p className="text-xl opacity-80 mt-2">
              Willkommen, {lehrer.username}!
            </p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/teacher/settings')}
              className="px-6 py-3 bg-kahoot-blue rounded-lg font-bold"
            >
              ⚙️
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logoutLehrer}
              className="px-6 py-3 bg-kahoot-red rounded-lg font-bold"
            >
              Logout
            </motion.button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/teacher')}
            className="kahoot-card text-left p-6 hover:bg-white/20 transition-all"
          >
            <div className="text-4xl mb-2">🎮</div>
            <h3 className="text-xl font-bold">Gast-Session starten</h3>
            <p className="opacity-70">Schnelle Session ohne Klasse</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNewKlasse(true)}
            className="kahoot-card text-left p-6 hover:bg-white/20 transition-all"
          >
            <div className="text-4xl mb-2">➕</div>
            <h3 className="text-xl font-bold">Neue Klasse</h3>
            <p className="opacity-70">Klasse erstellen und verwalten</p>
          </motion.button>
        </div>

        {/* Neue Klasse Modal */}
        {showNewKlasse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewKlasse(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="kahoot-card max-w-md w-full"
            >
              <h2 className="text-2xl font-bold mb-4">Neue Klasse erstellen</h2>
              <input
                type="text"
                value={newKlasseName}
                onChange={(e) => setNewKlasseName(e.target.value)}
                placeholder="Klassenname (z.B. 5a)"
                className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewKlasse(false)}
                  className="flex-1 py-3 rounded-lg bg-white/20 font-bold"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreateKlasse}
                  className="flex-1 py-3 rounded-lg bg-kahoot-green font-bold"
                >
                  Erstellen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Klassen Liste */}
        <div className="kahoot-card">
          <h2 className="text-2xl font-bold mb-6">Meine Klassen</h2>
          
          {loading ? (
            <p className="text-center py-8 opacity-70">Lädt...</p>
          ) : klassen.length === 0 ? (
            <p className="text-center py-8 opacity-70">
              Noch keine Klassen vorhanden. Erstelle deine erste Klasse!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {klassen.map((klasse) => (
                <motion.button
                  key={klasse.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectKlasse(klasse)}
                  className="bg-gradient-to-br from-kahoot-blue to-kahoot-purple p-6 rounded-xl text-left"
                >
                  <h3 className="text-2xl font-bold mb-2">{klasse.name}</h3>
                  <p className="opacity-80">
                    {klasse.schueler.length} Schüler
                  </p>
                  <p className="opacity-80">
                    {klasse.sessions.length} Sessions
                  </p>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

