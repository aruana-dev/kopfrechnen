import { NextResponse } from 'next/server';

const JSONBIN_API_KEY = process.env.NEXT_PUBLIC_JSONBIN_API_KEY;
const INDEX_BIN_ID = process.env.NEXT_PUBLIC_INDEX_BIN_ID;

export async function POST() {
  try {
    if (!JSONBIN_API_KEY || !INDEX_BIN_ID) {
      return NextResponse.json(
        { error: 'API Key oder Index-Bin-ID fehlt' },
        { status: 500 }
      );
    }

    // 1. Lade Index
    const indexResponse = await fetch(`https://api.jsonbin.io/v3/b/${INDEX_BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': JSONBIN_API_KEY,
      },
    });

    if (!indexResponse.ok) {
      throw new Error('Index konnte nicht geladen werden');
    }

    const indexData = await indexResponse.json();
    const index = indexData.record;
    const schuelerCodes = index.schuelerCodes || {};

    let fixed = 0;
    let errors = 0;

    // 2. Für jeden Code, prüfe ob die Bin-ID gültig ist
    for (const [code, binId] of Object.entries(schuelerCodes)) {
      try {
        // Versuche Klasse zu laden
        const klasseResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
          headers: {
            'X-Master-Key': JSONBIN_API_KEY,
          },
        });

        if (!klasseResponse.ok) {
          console.log(`Ungültige Bin-ID für Code ${code}: ${binId}`);
          errors++;
          continue;
        }

        const klasseData = await klasseResponse.json();
        const klasse = klasseData.record;

        // 3. Korrigiere klasse.id wenn nötig
        if (klasse.id !== binId) {
          console.log(`Korrigiere Klassen-ID: ${klasse.id} → ${binId}`);
          klasse.id = binId;

          // Korrigiere auch alle Schüler klasseIds
          if (klasse.schueler) {
            klasse.schueler.forEach((s: any) => {
              if (s.klasseId !== binId) {
                s.klasseId = binId;
              }
            });
          }

          // Speichere aktualisierte Klasse
          await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Master-Key': JSONBIN_API_KEY,
            },
            body: JSON.stringify(klasse),
          });

          fixed++;
        }
      } catch (error) {
        console.error(`Fehler beim Verarbeiten von Code ${code}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Index repariert: ${fixed} Klassen korrigiert, ${errors} Fehler`,
      fixed,
      errors,
    });
  } catch (error) {
    console.error('Fix-Index Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

