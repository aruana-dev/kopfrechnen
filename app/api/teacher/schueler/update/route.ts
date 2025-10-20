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

    const { klasseId, schueler } = await request.json();

    if (!klasseId || !schueler) {
      return NextResponse.json({ error: 'Klasse und Schüler erforderlich' }, { status: 400 });
    }

    // Update Schüler
    await jsonbin.updateSchueler(klasseId, schueler);
    
    // Lade aktualisierte Klasse
    const updatedKlasse = await jsonbin.readBin(klasseId);

    return NextResponse.json({
      success: true,
      klasse: { ...updatedKlasse, id: klasseId }
    });

  } catch (error: any) {
    console.error('❌ Fehler beim Aktualisieren des Schülers:', error);
    return NextResponse.json(
      { error: error.message || 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

