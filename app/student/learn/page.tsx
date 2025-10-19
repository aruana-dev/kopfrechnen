'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { SessionSettings, Operation } from '@/types';
import { useSessionStore } from '@/store/useSessionStore';
import { useServerAuthStore } from '@/store/useServerAuthStore';
import { generiereAufgaben } from '@/lib/aufgaben-generator';
import { nanoid } from 'nanoid';

export default function StudentLearnPage() {
  const router = useRouter();
  const { setSession, setRole } = useSessionStore();
  const { schueler } = useServerAuthStore();
  const [settings, setSettings] = useState<SessionSettings>({
    reihen: [2, 3, 5],
    operationen: ['multiplikation'],
    anzahlAufgaben: 10,
    anzahlStellen: 2,
    mitKommastellen: false,
    mitMinuswerten: false,
    tempo: {
      vorgegeben: false,
    },
    direktWeiter: false,
    ranglisteAnzeige: 0,
  });

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!schueler) {
      router.push('/student/code');
      return;
    }
  }, [router, isHydrated, schueler]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  const handleOperationToggle = (operation: Operation) => {
    if (settings.operationen.includes(operation)) {
      if (settings.operationen.length > 1) {
        setSettings({
          ...settings,
          operationen: settings.operationen.filter(o => o !== operation),
        });
      }
    } else {
      setSettings({
        ...settings,
        operationen: [...settings.operationen, operation],
      });
    }
  };

  const handleReiheToggle = (reihe: number) => {
    if (settings.reihen.includes(reihe)) {
      if (settings.reihen.length > 1) {
        setSettings({
          ...settings,
          reihen: settings.reihen.filter(r => r !== reihe),
        });
      }
    } else {
      setSettings({
        ...settings,
        reihen: [...settings.reihen, reihe].sort((a, b) => a - b),
      });
    }
  };

  const handleStart = () => {
    if (!schueler) return;
    
    const session = {
      id: nanoid(),
      code: schueler.code,
      settings,
      aufgaben: generiereAufgaben(settings),
      teilnehmer: [{
        id: 'self',
        name: schueler.nickname || schueler.vorname,
        antworten: [],
        gesamtZeit: 0,
        durchschnittsZeit: 0,
      }],
      status: 'running' as const,
      startzeit: Date.now(),
    };

    setSession(session);
    setRole('student');
    router.push('/student/quiz');
  };

  if (!schueler) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/student/code')}
          className="text-sm opacity-70 hover:opacity-100 mb-4"
        >
          ← Zurück
        </button>

        <h1 className="text-4xl md:text-6xl font-bold text-center mb-4">
          🎓 Selbst lernen
        </h1>
        <p className="text-xl text-center opacity-80 mb-8">
          Hallo {schueler?.nickname || schueler?.vorname}! Wähle deine Übung:
        </p>

        <div className="space-y-6">
          {/* Operationen */}
          <div className="kahoot-card">
            <h2 className="text-2xl font-bold mb-4">Operationen</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'addition' as Operation, label: 'Addition', icon: '+' },
                { value: 'subtraktion' as Operation, label: 'Subtraktion', icon: '-' },
                { value: 'multiplikation' as Operation, label: 'Multiplikation', icon: '×' },
                { value: 'division' as Operation, label: 'Division', icon: '÷' },
              ].map((op) => (
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

          {/* Reihen */}
          <div className="kahoot-card">
            <h2 className="text-2xl font-bold mb-4">Reihen</h2>
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
                  {reihe}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Einstellungen */}
          <div className="kahoot-card">
            <h2 className="text-2xl font-bold mb-4">Einstellungen</h2>
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
                <label className="block mb-2">Anzahl Stellen: {settings.anzahlStellen}</label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={settings.anzahlStellen}
                  onChange={(e) => setSettings({ ...settings, anzahlStellen: parseInt(e.target.value) })}
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
                  <span>Direkt weiter</span>
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

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            className="kahoot-button bg-kahoot-green w-full"
          >
            🚀 Jetzt üben!
          </motion.button>
        </div>
      </div>
    </div>
  );
}

