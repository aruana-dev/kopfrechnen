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
  
  // Berechne Min/Max für exakte Stellenanzahl
  // Beispiel: 3 Stellen → min: 100, max: 999
  const maxWertLinks = Math.pow(10, stellenLinks) - 1;
  const minWertLinks = stellenLinks > 1 ? Math.pow(10, stellenLinks - 1) : 1;
  
  const maxWertRechts = Math.pow(10, stellenRechts) - 1;
  const minWertRechts = stellenRechts > 1 ? Math.pow(10, stellenRechts - 1) : 1;
  
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
      // Entscheidung: Reihen ODER Stellen
      // Wenn Reihen ausgewählt → verwende Reihen
      // Wenn keine Reihen → verwende Stellen
      if (settings.reihen.length > 0) {
        // Reihen-Modus: zahl1 = Reihe, zahl2 nach stellenRechts
        reihe = settings.reihen[Math.floor(Math.random() * settings.reihen.length)];
        zahl1 = reihe;
        zahl2 = generiereZahl(minWertRechts, maxWertRechts, settings.mitKommastellen);
      } else {
        // Stellen-Modus: Beide Zahlen nach Stellen generieren
        // Beispiel: 3 Stellen links, 5 Stellen rechts → 726 × 92837
        zahl1 = generiereZahl(minWertLinks, maxWertLinks, settings.mitKommastellen);
        zahl2 = generiereZahl(minWertRechts, maxWertRechts, settings.mitKommastellen);
      }
      
      ergebnis = zahl1 * zahl2;
      break;
      
    case 'division':
      // Division: zahl1 (Dividend, links) ÷ zahl2 (Divisor, rechts) = Ergebnis (Quotient)
      // Entscheidung: Reihen ODER Stellen
      // Wenn Reihen ausgewählt → verwende Reihen
      // Wenn keine Reihen → verwende Stellen
      if (settings.reihen.length > 0) {
        // Reihen-Modus: zahl2 = Reihe, Dividend nach stellenLinks
        reihe = settings.reihen[Math.floor(Math.random() * settings.reihen.length)];
        zahl2 = reihe;
        
        // Dividend soll stellenLinks haben
        // Beispiel: 5 Stellen → 10000 bis 99999
        // Quotient = Dividend / Divisor
        // Also: Quotient zwischen (minWertLinks / reihe) und (maxWertLinks / reihe)
        const minQuotient = Math.floor(minWertLinks / reihe);
        const maxQuotient = Math.floor(maxWertLinks / reihe);
        const quotient = Math.floor(Math.random() * (maxQuotient - minQuotient + 1)) + minQuotient;
        
        ergebnis = quotient;
        zahl1 = reihe * quotient; // Dividend = Divisor × Quotient (damit es aufgeht)
      } else {
        // Stellen-Modus: Beide Zahlen nach Stellen generieren
        // zahl1 (Dividend) nach stellenLinks, zahl2 (Divisor) nach stellenRechts
        // Beispiel: 5 Stellen links, 3 Stellen rechts → 84000 ÷ 742 = 113
        zahl2 = generiereZahl(minWertRechts, maxWertRechts, false); // Divisor nach stellenRechts
        const maxQuotient = Math.floor(maxWertLinks / Math.max(1, Math.abs(zahl2)));
        const minQuotient = Math.max(1, Math.floor(minWertLinks / Math.max(1, Math.abs(zahl2))));
        const quotient = Math.floor(Math.random() * (maxQuotient - minQuotient + 1)) + minQuotient;
        
        ergebnis = quotient;
        zahl1 = zahl2 * quotient; // Dividend = Divisor × Quotient (damit es aufgeht)
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

