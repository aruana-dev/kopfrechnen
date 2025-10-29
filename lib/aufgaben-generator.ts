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
  
  const maxWert = Math.pow(10, settings.anzahlStellen) - 1;
  const minWert = settings.mitMinuswerten ? -maxWert : 0;
  
  switch (operation) {
    case 'addition':
      zahl1 = generiereZahl(minWert, maxWert, settings.mitKommastellen);
      zahl2 = generiereZahl(minWert, maxWert, settings.mitKommastellen);
      ergebnis = runde(zahl1 + zahl2);
      break;
      
    case 'subtraktion':
      zahl1 = generiereZahl(minWert, maxWert, settings.mitKommastellen);
      zahl2 = generiereZahl(minWert, maxWert, settings.mitKommastellen);
      ergebnis = runde(zahl1 - zahl2);
      break;
      
    case 'multiplikation':
      // Bei Multiplikation: Reihe × Faktor (Faktor richtet sich nach Stellen)
      reihe = settings.reihen[Math.floor(Math.random() * settings.reihen.length)];
      
      // Faktor basierend auf anzahlStellen generieren
      const maxFaktor = Math.pow(10, Math.max(1, settings.anzahlStellen - 1));
      const minFaktor = settings.anzahlStellen > 1 ? Math.pow(10, settings.anzahlStellen - 2) : 1;
      const faktor = Math.floor(Math.random() * (maxFaktor - minFaktor + 1)) + minFaktor;
      
      zahl1 = reihe;
      zahl2 = faktor;
      ergebnis = zahl1 * zahl2;
      break;
      
    case 'division':
      // Division: Dividend ÷ Reihe = Quotient (Quotient richtet sich nach Stellen)
      reihe = settings.reihen[Math.floor(Math.random() * settings.reihen.length)];
      
      // Quotient basierend auf anzahlStellen generieren
      const maxQuotient = Math.pow(10, Math.max(1, settings.anzahlStellen - 1));
      const minQuotient = settings.anzahlStellen > 1 ? Math.pow(10, settings.anzahlStellen - 2) : 1;
      const quotient = Math.floor(Math.random() * (maxQuotient - minQuotient + 1)) + minQuotient;
      
      ergebnis = quotient;
      zahl2 = reihe;
      zahl1 = reihe * quotient; // Dividend = Divisor × Quotient (damit es aufgeht)
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

