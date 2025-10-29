export type Operation = 'addition' | 'subtraktion' | 'multiplikation' | 'division';

export interface SessionSettings {
  reihen: number[]; // 1-12
  operationen: Operation[];
  anzahlAufgaben: number;
  anzahlStellen?: number; // Legacy - für Abwärtskompatibilität
  stellenLinks: number; // 1-6 - Stellen der linken Zahl
  stellenRechts: number; // 1-6 - Stellen der rechten Zahl
  mitKommastellen: boolean;
  mitMinuswerten: boolean;
  tempo: {
    vorgegeben: boolean;
    sekunden?: number; // nur wenn vorgegeben = true
  };
  direktWeiter: boolean; // automatisch weiter nach Anzahl Stellen
  ranglisteAnzeige: number; // 0 = alle, 1-5 = nur Top X
}

export interface Aufgabe {
  id: string;
  operation: Operation;
  zahl1: number;
  zahl2: number;
  ergebnis: number;
  index: number;
  reihe?: number; // Optional für Kompatibilität
}

export interface Teilnehmer {
  id: string;
  name: string;
  antworten: {
    aufgabeId: string;
    antwort: number | null;
    korrekt: boolean;
    zeit: number; // in ms
  }[];
  gesamtZeit: number;
  durchschnittsZeit: number;
}

export interface Session {
  id: string;
  code: string;
  settings: SessionSettings;
  aufgaben: Aufgabe[];
  teilnehmer: Teilnehmer[];
  status: 'lobby' | 'countdown' | 'running' | 'finished';
  startzeit?: number;
}

export interface SessionStats {
  teilnehmer: {
    id: string;
    name: string;
    punkte: number;
    gesamtZeit: number;
    durchschnittsZeit: number;
    platzVeraenderung?: number; // +/- Plätze im Vergleich zur letzten Session
    zeitVerbesserung?: number; // Zeitdifferenz in ms
  }[];
  isRevanche?: boolean;
  previousStats?: SessionStats;
}

