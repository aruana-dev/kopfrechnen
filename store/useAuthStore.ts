import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Teacher, Klasse } from '@/lib/jsonbin';

interface AuthStore {
  teacher: Teacher | null;
  activeKlasse: Klasse | null;
  isAuthenticated: boolean;
  userType: 'teacher' | 'student' | null; // Verhindere gleichzeitige Logins
  
  setTeacher: (teacher: Teacher | null) => void;
  setActiveKlasse: (klasse: Klasse | null) => void;
  logout: () => void;
  logoutStudent: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      teacher: null,
      activeKlasse: null,
      isAuthenticated: false,
      userType: null,
      
      setTeacher: (teacher) => {
        // Wenn Schüler angemeldet war, erst ausloggen
        if (get().userType === 'student') {
          localStorage.removeItem('schuelerCode');
          localStorage.removeItem('schuelerNickname');
        }
        
        set({ 
          teacher, 
          isAuthenticated: !!teacher,
          userType: teacher ? 'teacher' : null,
          activeKlasse: teacher ? get().activeKlasse : null, // Behalte Klasse nur bei Teacher
        });
      },
      
      setActiveKlasse: (klasse) => {
        // Wenn Klasse gesetzt wird, ist es ein Schüler
        if (klasse && !get().teacher) {
          // Lehrer ausloggen falls angemeldet
          set({ 
            teacher: null,
            activeKlasse: klasse,
            userType: 'student',
          });
        } else {
          set({ activeKlasse: klasse });
        }
      },
      
      logout: () => {
        localStorage.removeItem('schuelerCode');
        localStorage.removeItem('schuelerNickname');
        set({ 
          teacher: null, 
          activeKlasse: null, 
          isAuthenticated: false,
          userType: null,
        });
      },
      
      logoutStudent: () => {
        localStorage.removeItem('schuelerCode');
        localStorage.removeItem('schuelerNickname');
        set({
          activeKlasse: null,
          userType: get().teacher ? 'teacher' : null,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

