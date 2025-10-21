import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonbin } from '@/lib/jsonbin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    if (!teacher || !teacher.id) {
      return NextResponse.json(
        { error: 'Ungültige Session' },
        { status: 401 }
      );
    }

    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Klassenname erforderlich' },
        { status: 400 }
      );
    }

    console.log('📚 API: Erstelle Klasse:', name, 'für Lehrer:', teacher.username);

    // Create class
    const klasse = await jsonbin.createKlasse(teacher.id, name.trim());

    // Load full teacher data from Bin (includes passwordHash!)
    const fullTeacher = await jsonbin.readBin(teacher.id);
    if (!fullTeacher) {
      return NextResponse.json(
        { error: 'Lehrer nicht gefunden' },
        { status: 404 }
      );
    }

    // Update teacher with new class ID (preserves passwordHash)
    const updatedTeacher = {
      ...fullTeacher,
      klassen: [...(fullTeacher.klassen || []), klasse.id],
    };
    await jsonbin.updateBin(teacher.id, updatedTeacher);

    // Update cookie with new teacher data
    const response = NextResponse.json({
      success: true,
      klasse,
    });

    response.cookies.set('teacher_session', JSON.stringify(updatedTeacher), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    });

    console.log('✅ API: Klasse erstellt:', klasse.id);

    return response;

  } catch (error: any) {
    console.error('❌ API: Fehler beim Erstellen der Klasse:', error);
    return NextResponse.json(
      { error: error.message || 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

