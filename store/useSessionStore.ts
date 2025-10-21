import { create } from 'zustand';
import { Session, SessionStats } from '@/types';

interface SessionStore {
  session: Session | null;
  role: 'teacher' | 'student' | null;
  stats: SessionStats | null;
  previousStats: SessionStats | null;
  currentAufgabeIndex: number;
  startzeit: number | null;
  teilnehmerId: string | null;
  
  setSession: (session: Session) => void;
  setRole: (role: 'teacher' | 'student') => void;
  setStats: (stats: SessionStats) => void;
  setPreviousStats: (stats: SessionStats) => void;
  setCurrentAufgabeIndex: (index: number) => void;
  setStartzeit: (zeit: number) => void;
  setTeilnehmerId: (id: string) => void;
  reset: () => void;
  resetForRevanche: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  session: null,
  role: null,
  stats: null,
  previousStats: null,
  currentAufgabeIndex: 0,
  startzeit: null,
  teilnehmerId: null,
  
  setSession: (session) => set({ session }),
  setRole: (role) => set({ role }),
  setStats: (stats) => set({ stats }),
  setPreviousStats: (stats) => set({ previousStats: stats }),
  setCurrentAufgabeIndex: (index) => set({ currentAufgabeIndex: index }),
  setStartzeit: (zeit) => set({ startzeit: zeit }),
  setTeilnehmerId: (id) => set({ teilnehmerId: id }),
  reset: () => set({ 
    session: null, 
    role: null, 
    stats: null,
    previousStats: null,
    currentAufgabeIndex: 0,
    startzeit: null,
    teilnehmerId: null,
  }),
  resetForRevanche: () => set({ 
    session: null,
    currentAufgabeIndex: 0,
    startzeit: null,
    // Role, stats, previousStats und teilnehmerId bleiben erhalten!
  }),
}));

