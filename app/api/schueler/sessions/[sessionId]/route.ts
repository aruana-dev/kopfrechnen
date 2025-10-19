import { NextRequest, NextResponse } from 'next/server';
import { jsonbin } from '@/lib/jsonbin';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    
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

    // Finde die spezifische Session
    const session = klasse.sessions?.find((s: any) => s.sessionId === sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session nicht gefunden' },
        { status: 404 }
      );
    }

    // Finde das Ergebnis des Schülers
    const ergebnis = session.ergebnisse.find((erg: any) => erg.schuelerCode === sessionData.schuelerCode);
    if (!ergebnis) {
      return NextResponse.json(
        { error: 'Ergebnis nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        datum: session.datum,
        settings: session.settings
      },
      ergebnis: {
        schuelerCode: ergebnis.schuelerCode,
        nickname: ergebnis.nickname,
        punkte: ergebnis.punkte,
        gesamtZeit: ergebnis.gesamtZeit,
        durchschnittsZeit: ergebnis.durchschnittsZeit,
        antworten: ergebnis.antworten
      },
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
    console.error('Session-Details laden Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}
