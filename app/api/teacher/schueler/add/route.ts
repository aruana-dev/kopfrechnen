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

    const teacher = JSON.parse(teacherCookie.value);
    const { klasseId, vornamen } = await request.json();

    if (!klasseId || !vornamen || vornamen.length === 0) {
      return NextResponse.json({ error: 'Klasseund Vornamen erforderlich' }, { status: 400 });
    }

    // Füge Schüler hinzu
    await jsonbin.addSchuelerToKlasse(klasseId, vornamen);
    
    // Lade aktualisierte Klasse
    const updatedKlasse = await jsonbin.readBin(klasseId);

    return NextResponse.json({
      success: true,
      klasse: { ...updatedKlasse, id: klasseId }
    });

  } catch (error: any) {
    console.error('❌ Fehler beim Hinzufügen von Schülern:', error);
    return NextResponse.json(
      { error: error.message || 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

