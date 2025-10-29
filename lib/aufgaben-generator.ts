import { nanoid } from 'nanoid';
import { Aufgabe, Operation, SessionSettings } from '@/types';

export function generiereAufgaben(settings: SessionSettings): Aufgabe[] {
  const aufgaben: Aufgabe[] = [];
  
  for (let i = 0; i < settings.anzahlAufgaben; i++) {
    const operation = settings.operationen[Math.floor(Math.random() * settings.operationen.length)];
    const aufgabe = generiereAufgabe(operation, settings, i);
    aufgaben.push(aufgabe);
  }
  
  return aufgaben;
}

function generiereAufgabe(operation: Operation, settings: SessionSettings, index: number): Aufgabe {
  let zahl1: number;
  let zahl2: number;
  let ergebnis: number;
  let reihe: number | undefined;
  
  // Abwärtskompatibilität: Falls anzahlStellen noch verwendet wird
  const stellenLinks = settings.stellenLinks || settings.anzahlStellen || 2;
  const stellenRechts = settings.stellenRechts || settings.anzahlStellen || 2;
  
  const maxWertLinks = Math.pow(10, stellenLinks) - 1;
  const minWertLinks = settings.mitMinuswerten ? -maxWertLinks : 0;
  
  const maxWertRechts = Math.pow(10, stellenRechts) - 1;
  const minWertRechts = settings.mitMinuswerten ? -maxWertRechts : 0;
  
  switch (operation) {
    case 'addition':
      zahl1 = generiereZahl(minWertLinks, maxWertLinks, settings.mitKommastellen);
      zahl2 = generiereZahl(minWertRechts, maxWertRechts, settings.mitKommastellen);
      ergebnis = runde(zahl1 + zahl2);
      break;
      
    case 'subtraktion':
      zahl1 = generiereZahl(minWertLinks, maxWertLinks, settings.mitKommastellen);
      zahl2 = generiereZahl(minWertRechts, maxWertRechts, settings.mitKommastellen);
      ergebnis = runde(zahl1 - zahl2);
      break;
      
    case 'multiplikation':
      // Bei Multiplikation: zahl1 (links) × zahl2 (rechts)
      // Wenn Reihen ausgewählt, dann zahl1 = Reihe
      if (settings.reihen.length > 0) {
        reihe = settings.reihen[Math.floor(Math.random() * settings.reihen.length)];
        zahl1 = reihe;
        
        // zahl2 basierend auf stellenRechts
        const maxFaktor = Math.pow(10, Math.max(1, stellenRechts));
        const minFaktor = stellenRechts > 1 ? Math.pow(10, stellenRechts - 1) : 1;
        zahl2 = Math.floor(Math.random() * (maxFaktor - minFaktor)) + minFaktor;
      } else {
        // Keine Reihen: Beide Zahlen nach Stellen generieren
        zahl1 = generiereZahl(minWertLinks, maxWertLinks, settings.mitKommastellen);
        zahl2 = generiereZahl(minWertRechts, maxWertRechts, settings.mitKommastellen);
      }
      
      ergebnis = zahl1 * zahl2;
      break;
      
    case 'division':
      // Division: zahl1 (Dividend, links) ÷ zahl2 (Divisor, rechts) = Ergebnis (Quotient)
      // Wenn Reihen ausgewählt, dann zahl2 = Reihe
      if (settings.reihen.length > 0) {
        reihe = settings.reihen[Math.floor(Math.random() * settings.reihen.length)];
        zahl2 = reihe;
        
        // Quotient basierend auf stellenLinks generieren
        const maxQuotient = Math.pow(10, Math.max(1, stellenLinks));
        const minQuotient = stellenLinks > 1 ? Math.pow(10, stellenLinks - 1) : 1;
        const quotient = Math.floor(Math.random() * (maxQuotient - minQuotient)) + minQuotient;
        
        ergebnis = quotient;
        zahl1 = reihe * quotient; // Dividend = Divisor × Quotient (damit es aufgeht)
      } else {
        // Keine Reihen: Beide Zahlen nach Stellen generieren
        // zahl1 = Vielfaches von zahl2 (damit Division aufgeht)
        zahl2 = generiereZahl(Math.max(1, minWertRechts), maxWertRechts, false); // Divisor nie 0
        const maxQuotient = Math.floor(maxWertLinks / Math.max(1, Math.abs(zahl2)));
        const minQuotient = 1;
        const quotient = Math.floor(Math.random() * (maxQuotient - minQuotient + 1)) + minQuotient;
        
        ergebnis = quotient;
        zahl1 = zahl2 * quotient;
      }
      break;
  }
  
  return {
    id: nanoid(),
    operation,
    zahl1,
    zahl2,
    ergebnis,
    index,
    reihe,
  };
}

function generiereZahl(min: number, max: number, mitKommastellen: boolean): number {
  let zahl = Math.floor(Math.random() * (max - min + 1)) + min;
  
  if (mitKommastellen && Math.random() > 0.5) {
    const kommastellen = Math.floor(Math.random() * 2) + 1; // 1-2 Kommastellen
    zahl = parseFloat((zahl + Math.random()).toFixed(kommastellen));
  }
  
  return zahl;
}

function runde(zahl: number): number {
  return Math.round(zahl * 100) / 100;
}

export function getOperationSymbol(operation: Operation): string {
  switch (operation) {
    case 'addition': return '+';
    case 'subtraktion': return '-';
    case 'multiplikation': return '×';
    case 'division': return '÷';
  }
}

