import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/session-store';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const result = sessionStore.abortSession(id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Session nicht gefunden' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      session: result.session
    });
  } catch (error) {
    console.error('Session Abort Error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

