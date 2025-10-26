import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/session-store';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name, schuelerCode } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name erforderlich' },
        { status: 400 }
      );
    }

    console.log('👤 Teilnehmer tritt bei:', name, 'Code:', schuelerCode || 'N/A');
    const result = sessionStore.addTeilnehmer(id, name, schuelerCode);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Session nicht verfügbar' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      teilnehmer: result.teilnehmer,
      session: result.session
    });
  } catch (error) {
    console.error('Session Join Error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

