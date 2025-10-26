/**
 * usePolling Hook - Ersetzt useSocket
 * Verwendet HTTP Polling statt WebSockets
 */

import { useEffect, useRef, useCallback } from 'react';

interface PollingOptions {
  enabled?: boolean;
  interval?: number; // in ms, default 2000
}

export function usePolling(sessionId: string | null, options: PollingOptions = {}) {
  const { enabled = true, interval = 2000 } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef<Map<string, Function>>(new Map());

  // Polling starten
  useEffect(() => {
    if (!sessionId || !enabled) {
      return;
    }

    const poll = async () => {
      try {
        const response = await fetch(`/api/session/${sessionId}/status`);
        if (response.ok) {
          const { session } = await response.json();
          
          // Trigger callbacks
          callbacksRef.current.forEach((callback) => {
            callback(session);
          });
        }
      } catch (error) {
        console.error('Polling Error:', error);
      }
    };

    // Initial poll
    poll();

    // Start interval
    intervalRef.current = setInterval(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionId, enabled, interval]);

  // Callback registrieren
  const on = useCallback((event: string, callback: Function) => {
    callbacksRef.current.set(event, callback);
  }, []);

  // Callback entfernen
  const off = useCallback((event: string) => {
    callbacksRef.current.delete(event);
  }, []);

  return {
    on,
    off,
    connected: true, // Immer "connected" da HTTP
  };
}

// Session-spezifische Helper Functions
export const sessionAPI = {
  // Session erstellen
  async createSession(settings: any, oldSessionId?: string): Promise<{ sessionId: string; code: string; session: any } | null> {
    try {
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, oldSessionId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Create Session Error:', error);
      return null;
    }
  },

  // Session per Code laden
  async getSessionByCode(code: string): Promise<any | null> {
    try {
      const response = await fetch(`/api/session/code?code=${code}`);
      if (response.ok) {
        const { session } = await response.json();
        return session;
      }
      return null;
    } catch (error) {
      console.error('Get Session Error:', error);
      return null;
    }
  },

  // Session beitreten
  async joinSession(sessionId: string, name: string, schuelerCode?: string): Promise<{ teilnehmer: any; session: any } | null> {
    try {
      const response = await fetch(`/api/session/${sessionId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, schuelerCode }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Join Session Error:', error);
      return null;
    }
  },

  // Session starten
  async startSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/session/${sessionId}/start`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Start Session Error:', error);
      return false;
    }
  },

  // Antwort einreichen
  async submitAntwort(sessionId: string, teilnehmerId: string, aufgabeId: string, antwort: number, zeit: number): Promise<{ session: any; alleFertig: boolean } | null> {
    try {
      const response = await fetch(`/api/session/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teilnehmerId, aufgabeId, antwort, zeit }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Submit Antwort Error:', error);
      return null;
    }
  },

  // Session abbrechen
  async abortSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/session/${sessionId}/abort`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Abort Session Error:', error);
      return false;
    }
  },
};

