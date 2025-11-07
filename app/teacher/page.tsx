'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { SessionSettings, Operation } from '@/types';
import { sessionAPI } from '@/hooks/usePolling';
import { useSessionStore } from '@/store/useSessionStore';

const OPERATIONEN: { value: Operation; label: string; icon: string }[] = [
  { value: 'addition', label: 'Addition', icon: '+' },
  { value: 'subtraktion', label: 'Subtraktion', icon: '-' },
  { value: 'multiplikation', label: 'Multiplikation', icon: '×' },
  { value: 'division', label: 'Division', icon: '÷' },
];

export default function TeacherPage() {
  const router = useRouter();
  const { setSession, setRole } = useSessionStore();
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState<SessionSettings>({
    reihen: [], // Standard: Keine Reihen → Stellen werden verwendet
    operationen: ['multiplikation'],
    anzahlAufgaben: 10,
    stellenLinks: 2,
    stellenRechts: 2,
    mitKommastellen: false,
    mitMinuswerten: false,
    tempo: {
      vorgegeben: false,
    },
    direktWeiter: false,
    ranglisteAnzeige: 0, // 0 = alle
  });

  const handleReiheToggle = (reihe: number) => {
    if (settings.reihen.includes(reihe)) {
      // Erlaube das Abwählen aller Reihen (dann werden Stellen verwendet)
      setSettings({
        ...settings,
        reihen: settings.reihen.filter(r => r !== reihe),
      });
    } else {
      setSettings({
        ...settings,
        reihen: [...settings.reihen, reihe].sort((a, b) => a - b),
      });
    }
  };

  const handleAlleReihenAbwaehlen = () => {
    setSettings({
      ...settings,
      reihen: [],
    });
  };

  const handleAlleReihenAuswaehlen = () => {
    setSettings({
      ...settings,
      reihen: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    });
  };

  const handleOperationToggle = (operation: Operation) => {
    if (settings.operationen.includes(operation)) {
      setSettings({
        ...settings,
        operationen: settings.operationen.filter(o => o !== operation),
      });
    } else {
      setSettings({
        ...settings,
        operationen: [...settings.operationen, operation],
      });
    }
  };

  const handleCreateSession = async () => {
    // Reihen sind optional - wenn keine ausgewählt, werden Stellen verwendet
    if (settings.operationen.length === 0) {
      alert('Bitte mindestens eine Operation auswählen!');
      return;
    }

    setLoading(true);
    console.log('Lehrer: Erstelle Session...');
    
    try {
      const result = await sessionAPI.createSession(settings);
      
      if (result) {
        console.log('✅ Session erstellt:', result.sessionId, result.code);
        setSession(result.session);
        setRole('teacher');
        router.push(`/teacher/lobby?code=${result.code}`);
      } else {
        alert('Fehler beim Erstellen der Session');
      }
    } catch (error) {
      console.error('Fehler:', error);
      alert('Fehler beim Erstellen der Session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-role="teacher" className="min-h-screen p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-8">
          📝 Session erstellen
        </h1>

        <div className="space-y-6">
          {/* Reihen */}
          <div className="kahoot-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Reihen auswählen</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleAlleReihenAbwaehlen}
                  className="px-3 py-1 text-sm rounded-lg bg-white/20 hover:bg-white/30 text-white/80 hover:text-white transition-all"
                >
                  Alle abwählen
                </button>
                <button
                  onClick={handleAlleReihenAuswaehlen}
                  className="px-3 py-1 text-sm rounded-lg bg-white/20 hover:bg-white/30 text-white/80 hover:text-white transition-all"
                >
                  Alle auswählen
                </button>
              </div>
            </div>
            {settings.reihen.length === 0 && (
              <div className="mb-4 p-3 rounded-lg bg-kahoot-blue/30 border border-kahoot-blue/50">
                <p className="text-sm text-white/90">
                  ℹ️ Keine Reihen ausgewählt. Die Aufgaben werden nach <strong>Stellen</strong> generiert (siehe Schwierigkeit).
                </p>
              </div>
            )}
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((reihe) => (
                <motion.button
                  key={reihe}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleReiheToggle(reihe)}
                  className={`aspect-square rounded-xl font-bold text-xl transition-all ${
                    settings.reihen.includes(reihe)
                      ? 'bg-kahoot-green text-white'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  {reihe}er
                </motion.button>
              ))}
            </div>
          </div>

          {/* Operationen */}
          <div className="kahoot-card">
            <h2 className="text-2xl font-bold mb-4">Operationen auswählen</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {OPERATIONEN.map((op) => (
                <motion.button
                  key={op.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOperationToggle(op.value)}
                  className={`p-4 rounded-xl font-bold transition-all ${
                    settings.operationen.includes(op.value)
                      ? 'bg-kahoot-blue text-white'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  <div className="text-3xl mb-2">{op.icon}</div>
                  <div className="text-sm">{op.label}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Schwierigkeit */}
          <div className="kahoot-card">
            <h2 className="text-2xl font-bold mb-4">Schwierigkeit</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Anzahl Aufgaben: {settings.anzahlAufgaben}</label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={settings.anzahlAufgaben}
                  onChange={(e) => setSettings({ ...settings, anzahlAufgaben: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block mb-2">
                  Stellen Links (1. Zahl): {settings.stellenLinks}
                </label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={settings.stellenLinks}
                  onChange={(e) => setSettings({ ...settings, stellenLinks: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block mb-2">
                  Stellen Rechts (2. Zahl): {settings.stellenRechts}
                </label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={settings.stellenRechts}
                  onChange={(e) => setSettings({ ...settings, stellenRechts: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.mitKommastellen}
                    onChange={(e) => setSettings({ ...settings, mitKommastellen: e.target.checked })}
                    className="w-6 h-6"
                  />
                  <span>Mit Kommastellen</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.mitMinuswerten}
                    onChange={(e) => setSettings({ ...settings, mitMinuswerten: e.target.checked })}
                    className="w-6 h-6"
                  />
                  <span>Mit Minuswerten</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.direktWeiter}
                    onChange={(e) => setSettings({ ...settings, direktWeiter: e.target.checked })}
                    className="w-6 h-6"
                  />
                  <span>Direkt weiter (auto nach Stellen-Anzahl)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tempo */}
          <div className="kahoot-card">
            <h2 className="text-2xl font-bold mb-4">Tempo</h2>
            
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tempo.vorgegeben}
                  onChange={(e) => setSettings({
                    ...settings,
                    tempo: {
                      vorgegeben: e.target.checked,
                      sekunden: e.target.checked ? 5 : undefined,
                    },
                  })}
                  className="w-6 h-6"
                />
                <span>Tempo vorgeben</span>
              </label>

              {settings.tempo.vorgegeben && (
                <div>
                  <label className="block mb-2">
                    Sekunden pro Aufgabe: {settings.tempo.sekunden}
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="30"
                    value={settings.tempo.sekunden || 5}
                    onChange={(e) => setSettings({
                      ...settings,
                      tempo: {
                        vorgegeben: true,
                        sekunden: parseInt(e.target.value),
                      },
                    })}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Rangliste */}
          <div className="kahoot-card">
            <h2 className="text-2xl font-bold mb-4">Ranglisten-Anzeige</h2>
            
            <div className="flex flex-wrap gap-3">
              {[0, 1, 2, 3, 4, 5].map((anzahl) => (
                <motion.button
                  key={anzahl}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSettings({ ...settings, ranglisteAnzeige: anzahl })}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    settings.ranglisteAnzeige === anzahl
                      ? 'bg-kahoot-purple text-white'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  {anzahl === 0 ? 'Alle' : `Top ${anzahl}`}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateSession}
            disabled={loading}
            className="kahoot-button bg-kahoot-pink w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Erstelle Session...' : '🚀 Session erstellen'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
