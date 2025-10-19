import { NextRequest, NextResponse } from 'next/server';
import { jsonbin } from '@/lib/jsonbin';

export async function GET(request: NextRequest) {
  try {
    // Hole Schüler-Session aus Cookie
    const sessionCookie = request.cookies.get('schueler_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const sessionData = JSON.parse(sessionCookie.value);
    
    // Prüfe Ablaufzeit
    if (sessionData.expires < Date.now()) {
      return NextResponse.json(
        { error: 'Session abgelaufen' },
        { status: 401 }
      );
    }

    // Lade Klassendaten
    const klasse = await jsonbin.readBin(sessionData.klasseId);
    if (!klasse) {
      return NextResponse.json(
        { error: 'Klasse nicht gefunden' },
        { status: 404 }
      );
    }

    // Filtere Sessions für diesen Schüler
    const schuelerSessions = (klasse.sessions || []).filter((session: any) => 
      session.ergebnisse.some((erg: any) => erg.schuelerCode === sessionData.schuelerCode)
    );

    // Sortiere nach Datum (neueste zuerst)
    schuelerSessions.sort((a: any, b: any) => b.datum - a.datum);

    return NextResponse.json({
      success: true,
      sessions: schuelerSessions,
      schueler: {
        id: sessionData.schuelerId,
        code: sessionData.schuelerCode,
        vorname: sessionData.vorname,
        nickname: sessionData.nickname,
        klasseId: sessionData.klasseId,
        klasseName: sessionData.klasseName
      }
    });
  } catch (error) {
    console.error('Schüler-Sessions laden Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}
