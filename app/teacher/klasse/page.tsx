'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { jsonbin, Schueler } from '@/lib/jsonbin';
import { useSessionStore } from '@/store/useSessionStore';

export default function KlassePage() {
  const router = useRouter();
  const { teacher, activeKlasse, setActiveKlasse } = useAuthStore();
  const { setSession, setRole } = useSessionStore();
  const [schueler, setSchueler] = useState<Schueler[]>([]);
  const [vornamen, setVornamen] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [editingSchueler, setEditingSchueler] = useState<Schueler | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!teacher || !activeKlasse) {
      router.push('/teacher/dashboard');
      return;
    }
    setSchueler(activeKlasse.schueler || []);
  }, [teacher, activeKlasse, router, isHydrated]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  const handleAddSchueler = async () => {
    if (!activeKlasse || !vornamen.trim()) return;
    setLoading(true);

    try {
      // Split by comma or newline
      const vornamenList = vornamen
        .split(/[,\n]/)
        .map(v => v.trim())
        .filter(v => v.length > 0);

      if (vornamenList.length === 0) {
        alert('Bitte mindestens einen Vornamen eingeben!');
        setLoading(false);
        return;
      }

      await jsonbin.addSchuelerToKlasse(activeKlasse.id, vornamenList);
      
      const updatedKlasse = await jsonbin.readBin(activeKlasse.id);
      setActiveKlasse(updatedKlasse);
      setSchueler(updatedKlasse.schueler);
      setVornamen('');
    } catch (error) {
      console.error('Fehler beim Hinzufügen von Schülern:', error);
      alert('Fehler beim Hinzufügen von Schülern!');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSchueler = (schueler: Schueler) => {
    setEditingSchueler(schueler);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!activeKlasse || !editingSchueler) return;
    setLoading(true);

    try {
      await jsonbin.updateSchueler(activeKlasse.id, editingSchueler);
      
      const updatedKlasse = await jsonbin.readBin(activeKlasse.id);
      setActiveKlasse(updatedKlasse);
      setSchueler(updatedKlasse.schueler);
      setShowEditModal(false);
      setEditingSchueler(null);
    } catch (error) {
      console.error('Fehler beim Bearbeiten:', error);
      alert('Fehler beim Bearbeiten!');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchueler = async (schuelerId: string) => {
    if (!activeKlasse) return;
    if (!confirm('Schüler wirklich löschen? Alle Daten gehen verloren!')) return;
    
    setLoading(true);
    try {
      await jsonbin.deleteSchueler(activeKlasse.id, schuelerId);
      
      const updatedKlasse = await jsonbin.readBin(activeKlasse.id);
      setActiveKlasse(updatedKlasse);
      setSchueler(updatedKlasse.schueler);
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen!');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!activeKlasse || schueler.length === 0) return;

    // Einfache PDF-Alternative: Druckbare HTML-Seite
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Schüler-Codes - ${activeKlasse.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              color: #46178f;
              margin-bottom: 30px;
            }
            .code-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-top: 20px;
            }
            .code-card {
              border: 2px solid #46178f;
              border-radius: 10px;
              padding: 20px;
              text-align: center;
              page-break-inside: avoid;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #46178f;
              margin: 10px 0;
              letter-spacing: 3px;
            }
            .instructions {
              margin-top: 30px;
              padding: 20px;
              background: #f0f0f0;
              border-radius: 10px;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>🧮 Kopfrechnen - Klasse ${activeKlasse.name}</h1>
          
          <div class="instructions">
            <h2>Anleitung für Schüler:</h2>
            <ol>
              <li>Öffne die Kopfrechnen-App</li>
              <li>Klicke auf "Schüler"</li>
              <li>Gib deinen Schüler-Code ein</li>
              <li>Wähle einen Nickname</li>
              <li>Viel Erfolg!</li>
            </ol>
          </div>

          <h2>Schüler-Codes:</h2>
          <div class="code-grid">
            ${schueler.map((s, i) => `
              <div class="code-card">
                <div style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px;">${s.vorname}</div>
                <div style="font-size: 14px; color: #666;">Schüler #${i + 1}</div>
                <div class="code">${s.code}</div>
                <div style="font-size: 12px; color: #999; margin-top: 10px;">
                  Erstellt: ${new Date(s.created).toLocaleDateString('de-DE')}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; background: #46178f; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Drucken / Als PDF speichern
            </button>
            <button onclick="window.close()" style="padding: 10px 30px; font-size: 16px; background: #ccc; color: #333; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
              Schließen
            </button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleStartSession = () => {
    router.push('/teacher');
  };

  if (!activeKlasse) return null;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => router.push('/teacher/dashboard')}
              className="text-sm opacity-70 hover:opacity-100 mb-2"
            >
              ← Zurück zum Dashboard
            </button>
            <h1 className="text-4xl md:text-5xl font-bold">
              Klasse {activeKlasse.name}
            </h1>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartSession}
            className="kahoot-card p-6 text-left hover:bg-white/20"
          >
            <div className="text-4xl mb-2">🎮</div>
            <h3 className="text-xl font-bold">Session starten</h3>
            <p className="text-sm opacity-70">Mit dieser Klasse</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPDF}
            disabled={schueler.length === 0}
            className="kahoot-card p-6 text-left hover:bg-white/20 disabled:opacity-50"
          >
            <div className="text-4xl mb-2">📄</div>
            <h3 className="text-xl font-bold">PDF Export</h3>
            <p className="text-sm opacity-70">Schüler-Codes drucken</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/teacher/fortschritt')}
            className="kahoot-card p-6 text-left hover:bg-white/20"
          >
            <div className="text-4xl mb-2">📊</div>
            <h3 className="text-xl font-bold">Fortschritt</h3>
            <p className="text-sm opacity-70">Alle Ergebnisse ansehen</p>
          </motion.button>
        </div>

        {/* Neue Schüler hinzufügen */}
        <div className="kahoot-card mb-8">
          <h2 className="text-2xl font-bold mb-4">Schüler hinzufügen</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2">
                Vornamen (Komma oder Zeilenumbruch getrennt)
              </label>
              <textarea
                value={vornamen}
                onChange={(e) => setVornamen(e.target.value)}
                placeholder="Max, Anna, Tim&#10;oder einen pro Zeile"
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none resize-none"
              />
              <p className="text-sm opacity-70 mt-1">
                Beispiel: Max, Anna, Tim oder je ein Name pro Zeile
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddSchueler}
              disabled={loading || !vornamen.trim()}
              className="px-8 py-3 bg-kahoot-green rounded-lg font-bold disabled:opacity-50 self-start mt-8"
            >
              {loading ? '...' : 'Hinzufügen'}
            </motion.button>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && editingSchueler && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="kahoot-card max-w-md w-full"
            >
              <h2 className="text-2xl font-bold mb-4">Schüler bearbeiten</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Vorname</label>
                  <input
                    type="text"
                    value={editingSchueler.vorname}
                    onChange={(e) => setEditingSchueler({ ...editingSchueler, vorname: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Code (nur lesen)</label>
                  <input
                    type="text"
                    value={editingSchueler.code}
                    disabled
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-white/20 outline-none opacity-50"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 rounded-lg bg-white/20 font-bold"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className="flex-1 py-3 rounded-lg bg-kahoot-green font-bold disabled:opacity-50"
                  >
                    {loading ? '...' : 'Speichern'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Schüler-Liste */}
        <div className="kahoot-card">
          <h2 className="text-2xl font-bold mb-6">
            Schüler ({schueler.length})
          </h2>
          
          {schueler.length === 0 ? (
            <p className="text-center py-8 opacity-70">
              Noch keine Schüler vorhanden. Füge Schüler hinzu!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schueler.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-gradient-to-br from-kahoot-blue to-kahoot-purple p-4 rounded-xl"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm opacity-70">#{i + 1}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSchueler(s)}
                        className="text-xl hover:scale-110 transition-transform"
                        title="Bearbeiten"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteSchueler(s.id)}
                        className="text-xl hover:scale-110 transition-transform"
                        title="Löschen"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="text-xl font-bold mb-1">{s.vorname}</div>
                  <div className="text-2xl font-bold tracking-wider opacity-80">
                    {s.code}
                  </div>
                  <div className="text-xs opacity-60 mt-2">
                    Seit {new Date(s.created).toLocaleDateString('de-DE')}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

