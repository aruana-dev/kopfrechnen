import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jsonbin } from '@/lib/jsonbin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check authentication
  const cookieStore = await cookies();
  const teacherCookie = cookieStore.get('teacher_session');
  
  if (!teacherCookie) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }
  
  try {
    const klasseId = params.id;
    
    if (!klasseId) {
      return NextResponse.json(
        { error: 'Klassen-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Lade Klassendaten
    const klasse = await jsonbin.readBin(klasseId);
    if (!klasse) {
      return NextResponse.json(
        { error: 'Klasse nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      klasse: {
        id: klasseId,
        name: klasse.name,
        teacherId: klasse.teacherId,
        schueler: klasse.schueler || [],
        sessions: klasse.sessions || [],
        created: klasse.created
      }
    });
  } catch (error) {
    console.error('Klasse laden Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const klasseId = params.id;
    const updates = await request.json();
    
    if (!klasseId) {
      return NextResponse.json(
        { error: 'Klassen-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Lade aktuelle Klassendaten
    const klasse = await jsonbin.readBin(klasseId);
    if (!klasse) {
      return NextResponse.json(
        { error: 'Klasse nicht gefunden' },
        { status: 404 }
      );
    }

    // Update Klassendaten
    const updatedKlasse = { ...klasse, ...updates };
    await jsonbin.updateBin(klasseId, updatedKlasse);

    return NextResponse.json({
      success: true,
      klasse: {
        id: klasseId,
        name: updatedKlasse.name,
        teacherId: updatedKlasse.teacherId,
        schueler: updatedKlasse.schueler || [],
        sessions: updatedKlasse.sessions || [],
        created: updatedKlasse.created
      }
    });
  } catch (error) {
    console.error('Klasse aktualisieren Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}
