import { NextResponse } from 'next/server';

const JSONBIN_API_KEY = process.env.NEXT_PUBLIC_JSONBIN_API_KEY;
const INDEX_BIN_ID = process.env.NEXT_PUBLIC_INDEX_BIN_ID;

export async function GET() {
  try {
    if (!JSONBIN_API_KEY || !INDEX_BIN_ID) {
      return NextResponse.json(
        { error: 'API Key oder Index-Bin-ID fehlt' },
        { status: 500 }
      );
    }

    // Lade Index
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

    // Detaillierte Informationen über jeden Code
    const codeDetails = [];
    
    for (const [code, binId] of Object.entries(index.schuelerCodes || {})) {
      try {
        const klasseResponse = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
          headers: {
            'X-Master-Key': JSONBIN_API_KEY,
          },
        });

        if (klasseResponse.ok) {
          const klasseData = await klasseResponse.json();
          const klasse = klasseData.record;
          const schueler = klasse.schueler?.find((s: any) => s.code === code);
          
          codeDetails.push({
            code,
            binId,
            klasseId: klasse.id,
            klasseName: klasse.name,
            schuelerVorname: schueler?.vorname || 'Nicht gefunden',
            schuelerKlasseId: schueler?.klasseId || 'N/A',
            idsMatch: klasse.id === binId,
            schuelerIdsMatch: schueler?.klasseId === binId,
          });
        } else {
          codeDetails.push({
            code,
            binId,
            error: 'Klasse nicht gefunden (404)',
          });
        }
      } catch (error) {
        codeDetails.push({
          code,
          binId,
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      indexBinId: INDEX_BIN_ID,
      totalCodes: Object.keys(index.schuelerCodes || {}).length,
      codes: codeDetails,
    });
  } catch (error) {
    console.error('Debug-Index Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler', details: String(error) },
      { status: 500 }
    );
  }
}

