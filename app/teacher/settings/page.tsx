'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useServerAuthStore } from '@/store/useServerAuthStore';
import { jsonbin } from '@/lib/jsonbin';

export default function SettingsPage() {
  const router = useRouter();
  const { lehrer, logoutLehrer } = useServerAuthStore();
  const [tab, setTab] = useState<'username' | 'password'>('username');
  
  // Username Change
  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // LocalStorage Debug
  const [localStorageData, setLocalStorageData] = useState<any>({});

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!lehrer) {
      router.push('/auth/login');
      return;
    }
    
    // Lade localStorage Daten (nur für Debug-Anzeige)
    if (typeof window !== 'undefined') {
      const teacherBins = JSON.parse(localStorage.getItem('teacherBins') || '{}');
      setLocalStorageData(teacherBins);
    }
  }, [lehrer, router, isHydrated]);

  if (!isHydrated) {
    return (
      <div data-role="teacher" className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">Lädt...</p>
      </div>
    );
  }

  const handleCleanLocalStorage = () => {
    if (!confirm('LocalStorage wirklich bereinigen? Alle gespeicherten Zuordnungen gehen verloren!')) return;
    
    if (typeof window !== 'undefined') {
      // Nur aktuellen Teacher behalten
      if (lehrer) {
        const newMap: any = {};
        newMap[lehrer.username] = lehrer.id;
        localStorage.setItem('teacherBins', JSON.stringify(newMap));
        setLocalStorageData(newMap);
      }
    }
  };

  const handleUsernameChange = async () => {
    if (!lehrer || !newUsername.trim()) return;
    
    setUsernameLoading(true);
    setUsernameError('');
    setUsernameSuccess(false);

    try {
      await jsonbin.updateTeacherUsername(lehrer.id, lehrer.username, newUsername.trim());
      
      // Hinweis: Store wird beim nächsten Laden aktualisiert
      // Keine direkte setTeacher Methode mehr im useServerAuthStore
      
      setUsernameSuccess(true);
      setNewUsername('');
      
      setTimeout(() => setUsernameSuccess(false), 3000);
    } catch (error: any) {
      setUsernameError(error.message || 'Fehler beim Ändern des Benutzernamens');
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!lehrer) return;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Bitte alle Felder ausfüllen!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwörter stimmen nicht überein!');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Passwort muss mindestens 6 Zeichen lang sein!');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess(false);

    try {
      // Prüfe aktuelles Passwort
      const currentHash = await jsonbin.hashPassword(currentPassword);
      const teacherData = await jsonbin.readBin(lehrer.id);
      
      if (teacherData.passwordHash !== currentHash) {
        setPasswordError('Aktuelles Passwort ist falsch!');
        setPasswordLoading(false);
        return;
      }

      // Update Passwort
      await jsonbin.updateTeacherPassword(lehrer.id, newPassword);
      
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      setPasswordError(error.message || 'Fehler beim Ändern des Passworts');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!lehrer) return null;

  return (
    <div data-role="teacher" className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/teacher/dashboard')}
          className="text-sm opacity-70 hover:opacity-100 mb-4"
        >
          ← Zurück zum Dashboard
        </button>

        <h1 className="text-4xl md:text-5xl font-bold mb-8">
          ⚙️ Einstellungen
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('username')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              tab === 'username'
                ? 'bg-kahoot-blue text-white'
                : 'bg-white/20 text-white/60'
            }`}
          >
            Benutzername
          </button>
          <button
            onClick={() => setTab('password')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              tab === 'password'
                ? 'bg-kahoot-blue text-white'
                : 'bg-white/20 text-white/60'
            }`}
          >
            Passwort
          </button>
        </div>

        {/* Username Tab */}
        {tab === 'username' && (
          <div className="kahoot-card space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Aktueller Benutzername
              </label>
              <input
                type="text"
                value={lehrer.username}
                disabled
                className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-white/20 outline-none opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Neuer Benutzername
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => {
                  setNewUsername(e.target.value);
                  setUsernameError('');
                }}
                placeholder="Neuer Benutzername"
                className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none"
              />
            </div>

            {usernameError && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-kahoot-red/80 p-4 rounded-xl text-center"
              >
                {usernameError}
              </motion.div>
            )}

            {usernameSuccess && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-kahoot-green/80 p-4 rounded-xl text-center"
              >
                ✅ Benutzername erfolgreich geändert!
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUsernameChange}
              disabled={!newUsername.trim() || usernameLoading}
              className="kahoot-button bg-kahoot-green w-full disabled:opacity-50"
            >
              {usernameLoading ? '⏳ Speichere...' : 'Benutzername ändern'}
            </motion.button>
          </div>
        )}

        {/* Password Tab */}
        {tab === 'password' && (
          <div className="kahoot-card space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Aktuelles Passwort
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Aktuelles Passwort"
                className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Neues Passwort
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Neues Passwort (min. 6 Zeichen)"
                className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Passwort wiederholen"
                className="w-full px-4 py-3 rounded-lg bg-white/20 border-2 border-white/30 focus:border-white/60 outline-none"
              />
            </div>

            {passwordError && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-kahoot-red/80 p-4 rounded-xl text-center"
              >
                {passwordError}
              </motion.div>
            )}

            {passwordSuccess && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-kahoot-green/80 p-4 rounded-xl text-center"
              >
                ✅ Passwort erfolgreich geändert!
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePasswordChange}
              disabled={passwordLoading}
              className="kahoot-button bg-kahoot-green w-full disabled:opacity-50"
            >
              {passwordLoading ? '⏳ Speichere...' : 'Passwort ändern'}
            </motion.button>
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-8 kahoot-card bg-white/5">
          <h2 className="text-xl font-bold mb-4">🔍 Debug Info</h2>
          <div className="space-y-2 text-sm">
            <div>
              <p className="opacity-70">Aktuelle Bin-ID:</p>
              <p className="font-mono bg-black/30 p-2 rounded">{lehrer.id}</p>
            </div>
            <div>
              <p className="opacity-70">Gespeicherte Usernames in LocalStorage:</p>
              <div className="bg-black/30 p-2 rounded font-mono text-xs max-h-40 overflow-auto">
                {Object.keys(localStorageData).length > 0 ? (
                  <pre>{JSON.stringify(localStorageData, null, 2)}</pre>
                ) : (
                  <p>Leer</p>
                )}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCleanLocalStorage}
              className="w-full py-2 bg-kahoot-orange rounded-lg font-bold text-sm"
            >
              🧹 LocalStorage aufräumen
            </motion.button>
            <p className="text-xs opacity-60">
              Entfernt alte Einträge und behält nur deinen aktuellen Account
            </p>
          </div>
        </div>

        {/* Gefahrenzone */}
        <div className="mt-8 kahoot-card border-2 border-kahoot-red/50">
          <h2 className="text-2xl font-bold mb-4 text-kahoot-red">⚠️ Gefahrenzone</h2>
          <p className="opacity-80 mb-4">
            Vorsicht: Diese Aktionen können nicht rückgängig gemacht werden!
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (confirm('Wirklich ausloggen?')) {
                logoutLehrer();
                router.push('/');
              }
            }}
            className="kahoot-button bg-kahoot-red w-full"
          >
            🚪 Logout
          </motion.button>
        </div>
      </div>
    </div>
  );
}

