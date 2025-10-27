import { NextRequest, NextResponse } from 'next/server';
import { jsonbin } from '@/lib/jsonbin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { schuelerCode, newNickname } = await request.json();
    
    console.log('🔄 Update Nickname:', { schuelerCode, newNickname });
    
    if (!schuelerCode || !newNickname) {
      return NextResponse.json(
        { error: 'Schüler-Code und neuer Nickname sind erforderlich' },
        { status: 400 }
      );
    }

    // Finde Klasse über jsonbin
    const result = await jsonbin.findKlasseBySchuelerCode(schuelerCode);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Ungültiger Schüler-Code' },
        { status: 404 }
      );
    }

    const { klasse, binId } = result;
    const schueler = klasse.schueler?.find((s: any) => s.code === schuelerCode);
    
    if (!schueler) {
      return NextResponse.json(
        { error: 'Schüler nicht gefunden' },
        { status: 404 }
      );
    }

    // Update Nickname
    const oldNickname = schueler.nickname;
    schueler.nickname = newNickname;
    
    console.log('💾 Aktualisiere Nickname:', { old: oldNickname, new: newNickname });
    
    // Speichere in JSONBin
    await jsonbin.updateBin(binId, klasse);
    
    console.log('✅ Nickname erfolgreich aktualisiert');
    
    return NextResponse.json({
      success: true,
      message: 'Nickname erfolgreich aktualisiert',
      schueler: {
        id: schueler.id,
        code: schueler.code,
        vorname: schueler.vorname,
        nickname: schueler.nickname,
        klasseId: schueler.klasseId
      }
    });
  } catch (error: any) {
    console.error('❌ Nickname-Update Fehler:', error);
    return NextResponse.json(
      { 
        error: 'Interner Server-Fehler',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

