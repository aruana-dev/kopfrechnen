import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Teacher, Klasse } from '@/lib/jsonbin';

interface AuthStore {
  teacher: Teacher | null;
  activeKlasse: Klasse | null;
  isAuthenticated: boolean;
  
  setTeacher: (teacher: Teacher | null) => void;
  setActiveKlasse: (klasse: Klasse | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      teacher: null,
      activeKlasse: null,
      isAuthenticated: false,
      
      setTeacher: (teacher) => set({ 
        teacher, 
        isAuthenticated: !!teacher 
      }),
      
      setActiveKlasse: (klasse) => set({ activeKlasse: klasse }),
      
      logout: () => set({ 
        teacher: null, 
        activeKlasse: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

