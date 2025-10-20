import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonbin } from '@/lib/jsonbin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication via cookie
    const cookieStore = await cookies();
    const teacherCookie = cookieStore.get('teacher_session');

    if (!teacherCookie) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const teacher = JSON.parse(teacherCookie.value);

    if (!teacher || !teacher.id || !teacher.klassen) {
      return NextResponse.json(
        { error: 'Ungültige Session' },
        { status: 401 }
      );
    }

    console.log('📚 API: Lade Klassen für Lehrer:', teacher.username);

    // Load all classes
    const klassen = [];
    for (const klasseId of teacher.klassen) {
      try {
        const klasse = await jsonbin.readBin(klasseId);
        if (klasse) {
          klassen.push({ ...klasse, id: klasseId });
        }
      } catch (error) {
        console.error('❌ Fehler beim Laden der Klasse:', klasseId, error);
        // Continue with other classes
      }
    }

    console.log('✅ API: Klassen geladen:', klassen.length);

    return NextResponse.json({
      success: true,
      klassen,
    });

  } catch (error: any) {
    console.error('❌ API: Fehler beim Laden der Klassen:', error);
    return NextResponse.json(
      { error: error.message || 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

