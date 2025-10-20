'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { SessionSettings, Operation } from '@/types';
import { useSocket } from '@/hooks/useSocket';
import { useSessionStore } from '@/store/useSessionStore';

const OPERATIONEN: { value: Operation; label: string; icon: string }[] = [
  { value: 'addition', label: 'Addition', icon: '+' },
  { value: 'subtraktion', label: 'Subtraktion', icon: '-' },
  { value: 'multiplikation', label: 'Multiplikation', icon: '×' },
  { value: 'division', label: 'Division', icon: '÷' },
];

export default function TeacherPage() {
  const router = useRouter();
  const { socket, connected } = useSocket();
  const { setSession, setRole } = useSessionStore();

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
    ranglisteAnzeige: 0, // 0 = alle
  });

  const handleReiheToggle = (reihe: number) => {
    if (settings.reihen.includes(reihe)) {
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

  const handleCreateSession = () => {
    if (!socket || !connected) {
      console.log('Lehrer: Socket nicht verfügbar');
      return;
    }
    if (settings.reihen.length === 0) {
      alert('Bitte mindestens eine Reihe auswählen!');
      return;
    }
    if (settings.operationen.length === 0) {
      alert('Bitte mindestens eine Operation auswählen!');
      return;
    }

    console.log('Lehrer: Erstelle Session, Socket ID:', socket.id);
    
    // Entferne alte Event-Handler um Duplikate zu vermeiden
    socket.off('session-created');
    
    // Registriere neuen Event-Handler
    socket.on('session-created', ({ sessionId, code, session }) => {
      console.log('Lehrer: Session erstellt!', sessionId, code);
      setSession(session);
      setRole('teacher');
      // Entferne Handler nach Ausführung
      socket.off('session-created');
      router.push(`/teacher/lobby?code=${code}`);
    });
    
    // Sende create-session Event
    socket.emit('create-session', settings);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
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
            <h2 className="text-2xl font-bold mb-4">Reihen auswählen</h2>
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
            disabled={!connected}
            className="kahoot-button bg-kahoot-pink w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connected ? '🚀 Session erstellen' : '⏳ Verbinde...'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
