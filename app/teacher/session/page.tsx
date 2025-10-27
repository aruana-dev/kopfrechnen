'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { sessionAPI } from '@/hooks/usePolling';
import { useSessionStore } from '@/store/useSessionStore';

// Speichere Multiplayer-Ergebnisse für alle Teilnehmer
const saveMultiplayerResults = async (session: any) => {
  try {
    // Speichere für jeden Teilnehmer mit Schüler-Code
    for (const teilnehmer of session.teilnehmer) {
      // Prüfe ob Teilnehmer einen Schüler-Code hat (nicht "self" im Solo-Modus)
      if (!teilnehmer.schuelerCode || teilnehmer.id === 'self') {
        console.log('⏭️ Überspringe Teilnehmer ohne Schüler-Code:', teilnehmer.name);
        continue;
      }

      const punkte = teilnehmer.antworten.filter((a: any) => a.korrekt).length;
      
      console.log('💾 Speichere Ergebnis für:', teilnehmer.name, '(Code:', teilnehmer.schuelerCode, ')');
      
      const response = await fetch('/api/sessions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          schuelerCode: teilnehmer.schuelerCode,
          nickname: teilnehmer.name,
          punkte,
          gesamtZeit: teilnehmer.gesamtZeit,
          durchschnittsZeit: teilnehmer.durchschnittsZeit,
          antworten: teilnehmer.antworten,
          aufgaben: session.aufgaben,
          settings: session.settings // Session-Settings mitschicken!
        })
      });
      
      if (response.ok) {
        console.log('✅ Ergebnis gespeichert für:', teilnehmer.name);
      } else {
        console.error('❌ Fehler beim Speichern für:', teilnehmer.name, await response.text());
      }
    }
    
    console.log('✅ Alle Multiplayer-Ergebnisse gespeichert!');
  } catch (error) {
    console.error('❌ Fehler beim Speichern der Multiplayer-Ergebnisse:', error);
  }
};

export default function TeacherSession() {
  const router = useRouter();
  const { session, stats, setStats, setSession } = useSessionStore();

  // Polling für Session-Updates
  useEffect(() => {
    if (!session) {
      router.push('/teacher');
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const updatedSession = await sessionAPI.getSessionByCode(session.code);
        
        if (updatedSession) {
          setSession(updatedSession);

          // Prüfe ob Session beendet ist
          if (updatedSession.status === 'finished') {
            // Berechne Rangliste
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
              )
              .map((t: any, index: number) => ({ ...t, rang: index + 1 }));
            
            setStats({ teilnehmer: rangliste });
            
            // Speichere Multiplayer-Session-Ergebnisse in JSONBin
            console.log('💾 Speichere Multiplayer-Session-Ergebnisse...');
            await saveMultiplayerResults(updatedSession);
            
            router.push('/results');
          }
        }
      } catch (error) {
        console.error('Polling-Fehler:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [session, router, setStats, setSession]);

  const handleAbort = async () => {
    if (!session) return;
    
    if (confirm('Quiz wirklich abbrechen? Die Rangliste wird mit den aktuellen Ergebnissen erstellt.')) {
      await sessionAPI.abortSession(session.id);
    }
  };

  if (!session) {
    return (
      <div data-role="teacher" className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  return (
    <div data-role="teacher" className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-8">
            📊 Quiz läuft...
          </h1>

          <div className="kahoot-card mb-8">
            <h2 className="text-2xl font-bold mb-6">Teilnehmer-Fortschritt</h2>
            
            <div className="space-y-4">
              {session.teilnehmer.map((teilnehmer: any) => {
                const progress = (teilnehmer.antworten.length / session.aufgaben.length) * 100;
                const korrekteAntworten = teilnehmer.antworten.filter((a: any) => a.korrekt).length;
                
                return (
                  <div key={teilnehmer.id} className="bg-white/10 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{teilnehmer.name}</span>
                      <span className="text-sm">
                        {teilnehmer.antworten.length} / {session.aufgaben.length} 
                        {teilnehmer.antworten.length > 0 && 
                          ` (${korrekteAntworten} richtig)`
                        }
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-kahoot-green to-kahoot-blue"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-8"
          >
            ⏳
          </motion.div>

          {/* Abbrechen-Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAbort}
            className="kahoot-button bg-kahoot-red"
          >
            ⏹️ Quiz abbrechen
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
