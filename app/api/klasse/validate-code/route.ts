import { NextRequest, NextResponse } from 'next/server';
import { jsonbin } from '@/lib/jsonbin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    console.log('🔍 Validiere Code:', code);
    
    if (!code) {
      console.log('❌ Kein Code angegeben');
      return NextResponse.json(
        { error: 'Code ist erforderlich' },
        { status: 400 }
      );
    }

    // Finde Klasse über jsonbin
    console.log('📦 Suche Klasse für Code:', code);
    const result = await jsonbin.findKlasseBySchuelerCode(code);
    console.log('📦 Result:', result ? 'Gefunden' : 'Nicht gefunden');
    
    if (!result) {
      console.log('❌ Ungültiger Code:', code);
      return NextResponse.json({
        success: false,
        message: 'Ungültiger Schüler-Code'
      });
    }

    const { klasse } = result;
    console.log('📦 Klasse gefunden:', klasse.name);
    const schueler = klasse.schueler?.find((s: any) => s.code === code);
    
    if (!schueler) {
      console.log('❌ Schüler nicht in Klasse gefunden');
      return NextResponse.json({
        success: false,
        message: 'Schüler nicht gefunden'
      });
    }

    console.log('✅ Schüler gefunden:', schueler.vorname, 'Nickname:', schueler.nickname || 'nicht gesetzt');
    return NextResponse.json({
      success: true,
      message: 'Code gültig',
      klasse: {
        name: klasse.name,
        schueler: {
          vorname: schueler.vorname,
          code: schueler.code,
          nickname: schueler.nickname || null
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Code-Validierung Fehler:', error);
    console.error('❌ Error Stack:', error.stack);
    console.error('❌ Error Message:', error.message);
    return NextResponse.json(
      { 
        success: false,
        error: 'Interner Server-Fehler',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
