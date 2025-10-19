import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Schueler {
  id: string;
  code: string;
  vorname: string;
  nickname: string;
  klasseId: string;
  klasseName: string;
}

interface Lehrer {
  id: string;
  username: string;
  klassen: string[];
}

interface ServerAuthStore {
  // Schüler
  schueler: Schueler | null;
  schuelerSessions: any[] | null;
  
  // Lehrer
  lehrer: Lehrer | null;
  activeKlasse: any | null;
  
  // Status
  isLoading: boolean;
  error: string | null;
  
  // Schüler-Aktionen
  loginSchueler: (schuelerCode: string, nickname: string) => Promise<boolean>;
  loadSchuelerSessions: () => Promise<void>;
  logoutSchueler: () => void;
  
  // Lehrer-Aktionen
  loginLehrer: (username: string, password: string, mode: 'login' | 'register') => Promise<boolean>;
  loadLehrerData: () => Promise<void>;
  setActiveKlasse: (klasse: any) => void;
  logoutLehrer: () => void;
  
  // Allgemein
  clearError: () => void;
}

export const useServerAuthStore = create<ServerAuthStore>()(
  persist(
    (set, get) => ({
      // Initial State
      schueler: null,
      schuelerSessions: null,
      lehrer: null,
      activeKlasse: null,
      isLoading: false,
      error: null,

      // Schüler-Aktionen
      loginSchueler: async (schuelerCode: string, nickname: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/schueler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schuelerCode, nickname })
          });

          const data = await response.json();

          if (data.success) {
            set({ 
              schueler: data.schueler,
              isLoading: false,
              error: null
            });
            return true;
          } else {
            set({ 
              error: data.error,
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          set({ 
            error: 'Netzwerk-Fehler',
            isLoading: false
          });
          return false;
        }
      },

      loadSchuelerSessions: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/schueler/sessions');
          const data = await response.json();

          if (data.success) {
            set({ 
              schuelerSessions: data.sessions,
              schueler: data.schueler,
              isLoading: false,
              error: null
            });
          } else {
            set({ 
              error: data.error,
              isLoading: false
            });
          }
        } catch (error) {
          set({ 
            error: 'Netzwerk-Fehler',
            isLoading: false
          });
        }
      },

      logoutSchueler: async () => {
        try {
          await fetch('/api/auth/schueler', { method: 'DELETE' });
        } catch (error) {
          console.error('Logout-Fehler:', error);
        }
        
        set({ 
          schueler: null,
          schuelerSessions: null,
          activeKlasse: null,
          error: null
        });
      },

      // Lehrer-Aktionen
      loginLehrer: async (username: string, password: string, mode: 'login' | 'register') => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/lehrer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, mode })
          });

          const data = await response.json();

          if (data.success) {
            set({ 
              lehrer: data.teacher,
              isLoading: false,
              error: null
            });
            return true;
          } else {
            set({ 
              error: data.error,
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          set({ 
            error: 'Netzwerk-Fehler',
            isLoading: false
          });
          return false;
        }
      },

      loadLehrerData: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/lehrer');
          const data = await response.json();

          if (data.success) {
            set({ 
              lehrer: data.teacher,
              isLoading: false,
              error: null
            });
          } else {
            set({ 
              error: data.error,
              isLoading: false
            });
          }
        } catch (error) {
          set({ 
            error: 'Netzwerk-Fehler',
            isLoading: false
          });
        }
      },

      setActiveKlasse: (klasse: any) => {
        set({ activeKlasse: klasse });
      },

      logoutLehrer: async () => {
        try {
          await fetch('/api/auth/lehrer', { method: 'DELETE' });
        } catch (error) {
          console.error('Logout-Fehler:', error);
        }
        
        set({ 
          lehrer: null,
          activeKlasse: null,
          error: null
        });
      },

      // Allgemein
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'server-auth-storage',
      partialize: (state) => ({
        // Nur persistiere grundlegende Daten, keine sensiblen Informationen
        schueler: state.schueler ? {
          id: state.schueler.id,
          code: state.schueler.code,
          vorname: state.schueler.vorname,
          nickname: state.schueler.nickname,
          klasseId: state.schueler.klasseId,
          klasseName: state.schueler.klasseName
        } : null,
        lehrer: state.lehrer ? {
          id: state.lehrer.id,
          username: state.lehrer.username,
          klassen: state.lehrer.klassen
        } : null,
        activeKlasse: state.activeKlasse
      })
    }
  )
);
