import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/session-store';

export const dynamic = 'force-dynamic';

// Polling Endpoint - wird alle 2 Sekunden vom Client aufgerufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const session = sessionStore.getSession(id);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session nicht gefunden' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Session Status Error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

