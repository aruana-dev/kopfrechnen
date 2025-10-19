import { NextRequest, NextResponse } from 'next/server';
import { jsonbin } from '@/lib/jsonbin';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, schuelerCode, nickname, punkte, gesamtZeit, durchschnittsZeit, antworten, aufgaben } = await request.json();
    
    if (!sessionId || !schuelerCode || !nickname || antworten === undefined) {
      return NextResponse.json(
        { error: 'Alle erforderlichen Felder müssen angegeben werden' },
        { status: 400 }
      );
    }

    // Finde Klasse über Schüler-Code
    const result = await jsonbin.findKlasseBySchuelerCode(schuelerCode);
    if (!result) {
      return NextResponse.json(
        { error: 'Klasse nicht gefunden' },
        { status: 404 }
      );
    }

    const { klasse, binId } = result;

    // Erweitere Antworten um Aufgaben-Details
    const erweiterteAntworten = antworten.map((antwort: any) => {
      const aufgabe = aufgaben?.find((a: any) => a.id === antwort.aufgabeId);
      return {
        ...antwort,
        richtig: antwort.korrekt, // Füge 'richtig' hinzu für Kompatibilität
        aufgabe: aufgabe ? {
          zahl1: aufgabe.zahl1,
          zahl2: aufgabe.zahl2,
          operation: aufgabe.operation,
          reihe: aufgabe.reihe,
          ergebnis: aufgabe.ergebnis
        } : null
      };
    });

    // Erstelle Session-Result
    const sessionResult = {
      sessionId,
      datum: Date.now(),
      settings: aufgaben?.[0]?.settings || {}, // Fallback für Settings
      ergebnisse: [{
        schuelerCode,
        nickname,
        punkte: punkte || 0,
        gesamtZeit: gesamtZeit || 0,
        durchschnittsZeit: durchschnittsZeit || 0,
        antworten: erweiterteAntworten,
      }],
    };

    // Speichere in jsonbin
    await jsonbin.saveSessionResult(binId, sessionResult);

    return NextResponse.json({
      success: true,
      message: 'Session-Ergebnis erfolgreich gespeichert'
    });
  } catch (error) {
    console.error('Session speichern Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}
