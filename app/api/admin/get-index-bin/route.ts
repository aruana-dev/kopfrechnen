import { NextResponse } from 'next/server';
import { jsonbin } from '@/lib/jsonbin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Hole oder erstelle Index-Bin
    const indexBinId = await (jsonbin as any).getOrCreateIndexBin();
    
    // Lade Index-Bin Daten
    const indexBin = await jsonbin.readBin(indexBinId);
    
    return NextResponse.json({
      success: true,
      indexBinId,
      indexBin,
      message: 'Index-Bin ID für NEXT_PUBLIC_INDEX_BIN_ID Environment Variable verwenden'
    });
  } catch (error: any) {
    console.error('❌ Fehler beim Abrufen der Index-Bin:', error);
    return NextResponse.json(
      { error: error.message || 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

