import { NextRequest, NextResponse } from 'next/server';
import { jsonbin } from '@/lib/jsonbin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
    console.log('📦 Lade Klasse:', sessionData.klasseId, 'für Schüler:', sessionData.schuelerCode);
    const klasse = await jsonbin.readBin(sessionData.klasseId);
    if (!klasse) {
      console.log('❌ Klasse nicht gefunden:', sessionData.klasseId);
      return NextResponse.json(
        { error: 'Klasse nicht gefunden' },
        { status: 404 }
      );
    }

    console.log('📊 Klasse geladen:', klasse.name, 'Sessions:', (klasse.sessions || []).length);

    // Filtere Sessions für diesen Schüler
    const schuelerSessions = (klasse.sessions || []).filter((session: any) => {
      // Prüfe ob ergebnisse existiert und ein Array ist
      if (!session.ergebnisse || !Array.isArray(session.ergebnisse)) {
        console.log('⚠️ Session ohne Ergebnisse gefunden:', session.sessionId);
        return false;
      }
      
      const hatErgebnis = session.ergebnisse.some((erg: any) => erg.schuelerCode === sessionData.schuelerCode);
      if (hatErgebnis) {
        console.log('✅ Session gefunden für Schüler:', session.sessionId, 'Datum:', new Date(session.datum).toLocaleString());
      }
      return hatErgebnis;
    });

    // Sortiere nach Datum (neueste zuerst)
    schuelerSessions.sort((a: any, b: any) => b.datum - a.datum);

    console.log('✅ Gefilterte Sessions für Schüler:', schuelerSessions.length);

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
