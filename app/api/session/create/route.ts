import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/session-store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { settings } = await request.json();
    
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings erforderlich' },
        { status: 400 }
      );
    }

    const { session, code } = sessionStore.createSession(settings);
    
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      code,
      session
    });
  } catch (error) {
    console.error('Session Create Error:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

