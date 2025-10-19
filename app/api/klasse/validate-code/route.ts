import { NextRequest, NextResponse } from 'next/server';
import { jsonbin } from '@/lib/jsonbin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: 'Code ist erforderlich' },
        { status: 400 }
      );
    }

    // Finde Klasse über jsonbin
    const result = await jsonbin.findKlasseBySchuelerCode(code);
    
    if (!result) {
      return NextResponse.json({
        success: false,
        message: 'Ungültiger Schüler-Code'
      });
    }

    const { klasse } = result;
    const schueler = klasse.schueler?.find((s: any) => s.code === code);
    
    if (!schueler) {
      return NextResponse.json({
        success: false,
        message: 'Schüler nicht gefunden'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Code gültig',
      klasse: {
        name: klasse.name,
        schueler: {
          vorname: schueler.vorname,
          code: schueler.code
        }
      }
    });
  } catch (error) {
    console.error('Code-Validierung Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}
