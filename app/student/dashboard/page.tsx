'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useServerAuthStore } from '@/store/useServerAuthStore';

export default function StudentDashboard() {
  const router = useRouter();
  const { schueler, updateNickname, isLoading: authLoading } = useServerAuthStore();
  const [meineSessions, setMeineSessions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    gesamtSessions: 0,
    durchschnittsPunkte: 0,
    besteZeit: 0,
    gesamtAufgaben: 0,
  });

  const [isHydrated, setIsHydrated] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  useEffect(() => {
    // Warte auf Client-Side Hydration
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    console.log('Dashboard: Schüler-Daten:', schueler);
    
    if (!schueler) {
      console.log('Dashboard: Kein Schüler eingeloggt, redirect zu /student/code');
      router.push('/student/code');
      return;
    }
    
    loadMeineDaten();
  }, [router, isHydrated, schueler]);

  if (!isHydrated) {
    return (
      <div data-role="student" className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  const loadMeineDaten = async () => {
    if (!schueler) return;

    console.log('🔄 [DASHBOARD] Lade Daten für Schüler:', schueler.code);

    try {
      // Lade Daten über API Route
      const response = await fetch('/api/schueler/sessions');
      console.log('📥 [DASHBOARD] Response Status:', response.status);
      
      if (!response.ok) {
        console.error('❌ [DASHBOARD] API Error:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('📦 [DASHBOARD] Empfangene Sessions:', data.sessions?.length || 0);
      
      const klasse = { sessions: data.sessions };
      
      // Filtere alle Sessions, in denen dieser Schüler mitgemacht hat
      const sessions = (klasse.sessions || [])
        .map((session: any) => {
          // Prüfe ob ergebnisse existiert und ein Array ist
          if (!session.ergebnisse || !Array.isArray(session.ergebnisse)) {
            console.log('⚠️ [DASHBOARD] Session ohne Ergebnisse:', session.sessionId);
            return null;
          }
          
          const meinErgebnis = session.ergebnisse.find((e: any) => e.schuelerCode === schueler.code);
          if (meinErgebnis) {
            console.log('✅ [DASHBOARD] Eigenes Ergebnis gefunden in Session:', session.sessionId);
            return {
              ...session,
              meinErgebnis,
            };
          }
          return null;
        })
        .filter((s: any) => s !== null)
        .sort((a: any, b: any) => b.datum - a.datum); // Neueste zuerst

      console.log('✅ [DASHBOARD] Meine Sessions:', sessions.length);
      setMeineSessions(sessions);

      // Berechne Statistiken
      if (sessions.length > 0) {
        const totalPunkte = sessions.reduce((sum: number, s: any) => sum + s.meinErgebnis.punkte, 0);
        const totalAufgaben = sessions.reduce((sum: number, s: any) => sum + s.meinErgebnis.antworten.length, 0);
        const besteZeit = Math.min(...sessions.map((s: any) => s.meinErgebnis.durchschnittsZeit));

        console.log('📊 [DASHBOARD] Statistiken:', { 
          gesamtSessions: sessions.length, 
          totalPunkte, 
          totalAufgaben, 
          besteZeit 
        });

        setStats({
          gesamtSessions: sessions.length,
          durchschnittsPunkte: totalPunkte / sessions.length,
          besteZeit,
          gesamtAufgaben: totalAufgaben,
        });
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Fehler beim Laden der Daten:', error);
    }
  };

  const handleLogout = () => {
    const { logoutSchueler } = useServerAuthStore.getState();
    logoutSchueler();
    router.push('/');
  };

  const handleNicknameEdit = () => {
    setNewNickname(schueler?.nickname || '');
    setIsEditingNickname(true);
  };

  const handleNicknameSave = async () => {
    if (!newNickname.trim()) {
      return;
    }

    const success = await updateNickname(newNickname.trim());
    if (success) {
      setIsEditingNickname(false);
    }
  };

  const handleNicknameCancel = () => {
    setIsEditingNickname(false);
    setNewNickname('');
  };

  if (!schueler) {
    return null;
  }

  return (
    <div data-role="student" className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            {isEditingNickname ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="Neuer Nickname"
                    maxLength={20}
                    className="px-4 py-2 text-2xl rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNicknameSave();
                      if (e.key === 'Escape') handleNicknameCancel();
                    }}
                    autoFocus
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNicknameSave}
                    disabled={!newNickname.trim() || authLoading}
                    className="px-4 py-2 bg-kahoot-green rounded-lg font-bold disabled:opacity-50"
                  >
                    ✓ Speichern
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNicknameCancel}
                    className="px-4 py-2 bg-white/20 rounded-lg font-bold"
                  >
                    ✗ Abbrechen
                  </motion.button>
                </div>
                <p className="text-sm opacity-70">
                  Drücke Enter zum Speichern, Escape zum Abbrechen
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl md:text-5xl font-bold">
                    Hallo {schueler.nickname || schueler.vorname}! 👋
                  </h1>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleNicknameEdit}
                    className="text-2xl opacity-60 hover:opacity-100 transition-opacity"
                    title="Nickname ändern"
                  >
                    ✏️
                  </motion.button>
                </div>
                <p className="text-lg opacity-80 mt-2">
                  Code: {schueler.code}
                </p>
              </div>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="px-6 py-3 bg-kahoot-red rounded-lg font-bold"
          >
            Logout
          </motion.button>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="kahoot-card text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-3xl font-bold">{stats.gesamtSessions}</p>
            <p className="text-sm opacity-70">Sessions</p>
          </div>

          <div className="kahoot-card text-center">
            <div className="text-4xl mb-2">⭐</div>
            <p className="text-3xl font-bold">{stats.durchschnittsPunkte.toFixed(1)}</p>
            <p className="text-sm opacity-70">Ø Punkte</p>
          </div>

          <div className="kahoot-card text-center">
            <div className="text-4xl mb-2">⚡</div>
            <p className="text-3xl font-bold">
              {stats.besteZeit > 0 ? (stats.besteZeit / 1000).toFixed(1) : '-'}s
            </p>
            <p className="text-sm opacity-70">Beste Ø Zeit</p>
          </div>

          <div className="kahoot-card text-center">
            <div className="text-4xl mb-2">✏️</div>
            <p className="text-3xl font-bold">{stats.gesamtAufgaben}</p>
            <p className="text-sm opacity-70">Aufgaben</p>
          </div>
        </div>

        {/* Aktionen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/student/learn')}
            className="kahoot-card p-6 text-left hover:bg-white/20 transition-all"
          >
            <div className="text-4xl mb-2">🎓</div>
            <h3 className="text-xl font-bold">Selbst üben</h3>
            <p className="opacity-70">Eigene Übungs-Session starten</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/student')}
            className="kahoot-card p-6 text-left hover:bg-white/20 transition-all"
          >
            <div className="text-4xl mb-2">🎮</div>
            <h3 className="text-xl font-bold">Session beitreten</h3>
            <p className="opacity-70">Mit Session-Code beitreten</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/student/ergebnisse')}
            className="kahoot-card p-6 text-left hover:bg-white/20 transition-all"
          >
            <div className="text-4xl mb-2">📊</div>
            <h3 className="text-xl font-bold">Meine Ergebnisse</h3>
            <p className="opacity-70">Alle Übungen im Detail ansehen</p>
          </motion.button>
        </div>

        {/* Meine Sessions */}
        <div className="kahoot-card">
          <h2 className="text-2xl font-bold mb-6">📚 Meine Ergebnisse</h2>

          {meineSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-xl opacity-70">
                Noch keine Sessions gespielt
              </p>
              <p className="opacity-60 mt-2">
                Starte deine erste Übung oder tritt einer Session bei!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {meineSessions.map((session, index) => {
                const totalAufgaben = session.meinErgebnis.antworten.length;
                const richtig = session.meinErgebnis.punkte;
                const prozent = totalAufgaben > 0 ? (richtig / totalAufgaben * 100) : 0;

                return (
                  <motion.div
                    key={session.sessionId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/10 p-4 rounded-xl"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm opacity-70">
                          {new Date(session.datum).toLocaleString('de-DE')}
                        </p>
                        <p className="text-xs opacity-60">
                          Nickname: {session.meinErgebnis.nickname}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {richtig}/{totalAufgaben}
                        </p>
                        <p className="text-sm opacity-70">{prozent.toFixed(0)}%</p>
                      </div>
                    </div>

                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="opacity-70">⏱️ Ø Zeit: </span>
                        <span className="font-bold">
                          {(session.meinErgebnis.durchschnittsZeit / 1000).toFixed(1)}s
                        </span>
                      </div>
                      <div>
                        <span className="opacity-70">📊 Gesamt: </span>
                        <span className="font-bold">
                          {(session.meinErgebnis.gesamtZeit / 1000).toFixed(1)}s
                        </span>
                      </div>
                    </div>

                    {/* Fortschrittsbalken */}
                    <div className="mt-3 w-full bg-white/20 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          prozent >= 80 ? 'bg-kahoot-green' :
                          prozent >= 50 ? 'bg-kahoot-orange' :
                          'bg-kahoot-red'
                        }`}
                        style={{ width: `${prozent}%` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

