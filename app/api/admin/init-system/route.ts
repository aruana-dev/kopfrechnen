import { NextResponse } from 'next/server';
import { jsonbin } from '@/lib/jsonbin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Einmaliger Setup-Endpunkt für neues System
 * Rufe diesen Endpunkt einmal auf nach dem ersten Deployment
 * um den Index-Bin zu initialisieren
 */
export async function POST() {
  try {
    console.log('🚀 System-Initialisierung gestartet...');
    
    // Prüfe ob bereits ein Index-Bin existiert
    const bins = await (jsonbin as any).listBins();
    const existingIndexBins = bins.filter((b: any) => 
      b.name && b.name.includes('kopfrechnen_index')
    );
    
    if (existingIndexBins.length > 0) {
      const indexBin = existingIndexBins[0];
      console.log('✅ Index-Bin bereits vorhanden:', indexBin.id);
      
      // Lade und initialisiere
      const index = await jsonbin.readBin(indexBin.id);
      if (!index.teachers) index.teachers = {};
      if (!index.schuelerCodes) index.schuelerCodes = {};
      if (!index.type) index.type = 'kopfrechnen_index';
      
      await jsonbin.updateBin(indexBin.id, index);
      
      return NextResponse.json({
        success: true,
        message: 'System bereits initialisiert',
        indexBinId: indexBin.id,
        instructions: [
          '✅ Index-Bin gefunden und aktualisiert',
          `📝 Setze in Railway: NEXT_PUBLIC_INDEX_BIN_ID=${indexBin.id}`,
          '🔄 Starte Railway Service neu nach dem Setzen',
        ]
      });
    }
    
    // Erstelle neuen Index-Bin
    console.log('➕ Erstelle neuen Index-Bin...');
    const indexData = {
      type: 'kopfrechnen_index',
      schuelerCodes: {},
      teachers: {},
      created: Date.now(),
      version: '2.0',
    };
    
    const { id } = await (jsonbin as any).createBin(
      indexData, 
      'kopfrechnen_index_v2'
    );
    
    console.log('✅ Index-Bin erstellt:', id);
    
    return NextResponse.json({
      success: true,
      message: 'System erfolgreich initialisiert',
      indexBinId: id,
      instructions: [
        '✅ Neuer Index-Bin erstellt',
        `📝 Setze in Railway Environment Variables:`,
        `   NEXT_PUBLIC_INDEX_BIN_ID=${id}`,
        '🔄 Starte Railway Service neu',
        '✨ Danach ist das System einsatzbereit!',
      ]
    });
    
  } catch (error: any) {
    console.error('❌ System-Initialisierung fehlgeschlagen:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Interner Server-Fehler',
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

