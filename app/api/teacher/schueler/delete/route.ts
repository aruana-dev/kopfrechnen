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

    const { klasseId, schuelerId } = await request.json();

    if (!klasseId || !schuelerId) {
      return NextResponse.json({ error: 'Klasse und Schüler-ID erforderlich' }, { status: 400 });
    }

    // Lösche Schüler
    await jsonbin.deleteSchueler(klasseId, schuelerId);
    
    // Lade aktualisierte Klasse
    const updatedKlasse = await jsonbin.readBin(klasseId);

    return NextResponse.json({
      success: true,
      klasse: { ...updatedKlasse, id: klasseId }
    });

  } catch (error: any) {
    console.error('❌ Fehler beim Löschen des Schülers:', error);
    return NextResponse.json(
      { error: error.message || 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

