import { NextRequest, NextResponse } from 'next/server';
import { jsonbin } from '@/lib/jsonbin';

export async function POST(request: NextRequest) {
  try {
    const { schuelerCode, nickname } = await request.json();
    
    if (!schuelerCode || !nickname) {
      return NextResponse.json(
        { error: 'Schüler-Code und Nickname sind erforderlich' },
        { status: 400 }
      );
    }

    // Finde Klasse über jsonbin
    const result = await jsonbin.findKlasseBySchuelerCode(schuelerCode);
    if (!result) {
      return NextResponse.json(
        { error: 'Ungültiger Schüler-Code' },
        { status: 404 }
      );
    }

    const { klasse, binId } = result;
    const schueler = klasse.schueler?.find((s: any) => s.code === schuelerCode);
    
    if (!schueler) {
      return NextResponse.json(
        { error: 'Schüler nicht gefunden' },
        { status: 404 }
      );
    }

    // Erstelle Session-Token (vereinfacht für Demo)
    const sessionToken = `schueler_${schuelerCode}_${Date.now()}`;
    
    // Speichere Session-Daten (in Production: Redis oder Datenbank)
    const sessionData = {
      schuelerCode,
      nickname,
      schuelerId: schueler.id,
      klasseId: binId,
      klasseName: klasse.name,
      vorname: schueler.vorname,
      token: sessionToken,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 Stunden
    };

    // Setze HTTP-Only Cookie
    const response = NextResponse.json({
      success: true,
      schueler: {
        id: schueler.id,
        code: schueler.code,
        vorname: schueler.vorname,
        nickname,
        klasseId: binId,
        klasseName: klasse.name
      }
    });

    response.cookies.set('schueler_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
    });

    return response;
  } catch (error) {
    console.error('Schüler-Authentifizierung Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    return NextResponse.json({
      success: true,
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
    console.error('Session-Validierung Fehler:', error);
    return NextResponse.json(
      { error: 'Session ungültig' },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('schueler_session');
  return response;
}
