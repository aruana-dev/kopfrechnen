import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/session-store';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { teilnehmerId, aufgabeId, antwort, zeit } = await request.json();
    
    if (!teilnehmerId || !aufgabeId || antwort === undefined || !zeit) {
      return NextResponse.json(
        { error: 'Alle Felder erforderlich' },
        { status: 400 }
      );
    }

    const result = sessionStore.submitAntwort(id, teilnehmerId, aufgabeId, antwort, zeit);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Session/Teilnehmer/Aufgabe nicht gefunden' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      session: result.session,
      alleFertig: result.alleFertig
    });
  } catch (error) {
    console.error('Session Submit Error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

