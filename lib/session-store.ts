/**
 * In-Memory Session Store für Live-Sessions
 * Ersetzt Socket.io Sessions
 */

import { nanoid } from 'nanoid';
import { generiereAufgaben } from './aufgaben-generator';

export interface SessionTeilnehmer {
  id: string;
  name: string;
  schuelerCode?: string; // Für Speicherung in JSONBin
  antworten: Array<{
    aufgabeId: string;
    antwort: number;
    korrekt: boolean;
    zeit: number;
  }>;
  gesamtZeit: number;
  durchschnittsZeit: number;
}

export interface Session {
  id: string;
  code: string;
  settings: any;
  aufgaben: any[];
  teilnehmer: SessionTeilnehmer[];
  status: 'lobby' | 'countdown' | 'running' | 'finished';
  createdAt: number;
  startedAt?: number;
  revancheCode?: string; // Code der Revanche-Session (falls eine erstellt wurde)
}

class SessionStore {
  private sessions: Map<string, Session> = new Map();
  private codeToSessionId: Map<string, string> = new Map();

  // Session erstellen
  createSession(settings: any, oldSessionId?: string): { session: Session; code: string } {
    const sessionId = nanoid();
    const code = this.generateCode();
    
    // Verwende die zentrale Aufgaben-Generierung aus aufgaben-generator.ts
    const aufgaben = generiereAufgaben(settings);
    
    const session: Session = {
      id: sessionId,
      code,
      settings,
      aufgaben,
      teilnehmer: [],
      status: 'lobby',
      createdAt: Date.now(),
    };
    
    this.sessions.set(sessionId, session);
    this.codeToSessionId.set(code, sessionId);
    
    // Wenn dies eine Revanche ist, verlinke die alte Session
    if (oldSessionId) {
      const oldSession = this.sessions.get(oldSessionId);
      if (oldSession) {
        oldSession.revancheCode = code;
        console.log(`🔄 Revanche-Link gesetzt: ${oldSessionId} -> ${code}`);
      }
    }
    
    console.log(`📝 Session erstellt: ${sessionId}, Code: ${code}, Aufgaben: ${aufgaben.length}`);
    return { session, code };
  }

  // Session per Code finden
  getSessionByCode(code: string): Session | null {
    const sessionId = this.codeToSessionId.get(code);
    return sessionId ? this.sessions.get(sessionId) || null : null;
  }

  // Session per ID finden
  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  // Teilnehmer hinzufügen
  addTeilnehmer(sessionId: string, name: string, schuelerCode?: string): { success: boolean; teilnehmer?: SessionTeilnehmer; session?: Session } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false };
    }
    
    if (session.status !== 'lobby') {
      return { success: false };
    }
    
    const teilnehmer: SessionTeilnehmer = {
      id: nanoid(),
      name,
      schuelerCode, // Speichere Schüler-Code für spätere Persistierung
      antworten: [],
      gesamtZeit: 0,
      durchschnittsZeit: 0,
    };
    
    session.teilnehmer.push(teilnehmer);
    console.log(`✅ Teilnehmer hinzugefügt: ${name} (Code: ${schuelerCode || 'N/A'}) zu Session ${sessionId}`);
    
    return { success: true, teilnehmer, session };
  }

  // Session starten
  startSession(sessionId: string): { success: boolean; session?: Session } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false };
    }
    
    session.status = 'countdown';
    console.log(`⏱️ Session Countdown: ${sessionId}`);
    
    // Nach 10 Sekunden auf 'running' setzen
    setTimeout(() => {
      if (session.status === 'countdown') {
        session.status = 'running';
        session.startedAt = Date.now();
        console.log(`🚀 Session gestartet: ${sessionId}`);
      }
    }, 10000);
    
    return { success: true, session };
  }

  // Antwort einreichen
  submitAntwort(sessionId: string, teilnehmerId: string, aufgabeId: string, antwort: number, zeit: number): { success: boolean; session?: Session; alleFertig?: boolean } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false };
    }
    
    const teilnehmer = session.teilnehmer.find(t => t.id === teilnehmerId);
    if (!teilnehmer) {
      return { success: false };
    }
    
    const aufgabe = session.aufgaben.find(a => a.id === aufgabeId);
    if (!aufgabe) {
      return { success: false };
    }
    
    const korrekt = Math.abs(antwort - aufgabe.ergebnis) < 0.01;
    
    teilnehmer.antworten.push({ aufgabeId, antwort, korrekt, zeit });
    teilnehmer.gesamtZeit += zeit;
    teilnehmer.durchschnittsZeit = teilnehmer.gesamtZeit / teilnehmer.antworten.length;
    
    const alleFertig = session.teilnehmer.every(
      t => t.antworten.length === session.aufgaben.length
    );
    
    if (alleFertig) {
      session.status = 'finished';
      console.log(`🏁 Session beendet: ${sessionId}`);
    }
    
    return { success: true, session, alleFertig };
  }

  // Session abbrechen
  abortSession(sessionId: string): { success: boolean; session?: Session } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false };
    }
    
    session.status = 'finished';
    console.log(`⏹️ Session abgebrochen: ${sessionId}`);
    
    return { success: true, session };
  }

  // Alte Sessions aufräumen (älter als 2 Stunden)
  cleanup() {
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    
    Array.from(this.sessions.entries()).forEach(([sessionId, session]) => {
      if (now - session.createdAt > twoHours) {
        this.sessions.delete(sessionId);
        this.codeToSessionId.delete(session.code);
        console.log(`🗑️ Session gelöscht: ${sessionId}`);
      }
    });
  }

  // Hilfsfunktionen
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
}

// Singleton Instance
export const sessionStore = new SessionStore();

// Cleanup alle 30 Minuten
setInterval(() => {
  sessionStore.cleanup();
}, 30 * 60 * 1000);

