import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonbin } from '@/lib/jsonbin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const teacherCookie = cookieStore.get('teacher_session');

    if (!teacherCookie) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const { klasseId, schuelerCode, sessionId } = await request.json();

    if (!klasseId || !schuelerCode || !sessionId) {
      return NextResponse.json({ error: 'Alle Parameter erforderlich' }, { status: 400 });
    }

    // Lösche Session
    await jsonbin.deleteSchuelerSession(klasseId, schuelerCode, sessionId);
    
    // Lade aktualisierte Klasse
    const updatedKlasse = await jsonbin.readBin(klasseId);

    return NextResponse.json({
      success: true,
      klasse: { ...updatedKlasse, id: klasseId }
    });

  } catch (error: any) {
    console.error('❌ Fehler beim Löschen der Session:', error);
    return NextResponse.json(
      { error: error.message || 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

