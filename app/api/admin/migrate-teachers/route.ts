import { NextResponse } from 'next/server';
import { jsonbin } from '@/lib/jsonbin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🔧 Starte Lehrer-Migration');
    
    // 1. Liste alle Bins
    const bins = await (jsonbin as any).listBins();
    console.log('📦 Gefundene Bins:', bins.length);
    
    // 2. Finde alle Lehrer-Bins
    const teacherBins: any[] = [];
    for (const bin of bins) {
      try {
        const data = await jsonbin.readBin(bin.id);
        // Prüfe ob es ein Lehrer-Bin ist (hat username und passwordHash)
        if (data && data.username && data.passwordHash) {
          teacherBins.push({
            binId: bin.id,
            username: data.username,
            klassen: data.klassen || [],
            created: data.created
          });
          console.log('👨‍🏫 Lehrer gefunden:', data.username, bin.id);
        }
      } catch (error) {
        // Ignoriere Fehler beim Lesen einzelner Bins
        continue;
      }
    }
    
    console.log('✅ Lehrer-Bins gefunden:', teacherBins.length);
    
    // 3. Lade Index-Bin
    const indexBinId = await (jsonbin as any).getOrCreateIndexBin();
    const indexBin = await jsonbin.readBin(indexBinId);
    
    if (!indexBin.teachers) {
      indexBin.teachers = {};
    }
    
    console.log('📦 Index-Bin geladen, aktuelle Lehrer:', Object.keys(indexBin.teachers).length);
    
    // 4. Füge alle Lehrer zur Index-Bin hinzu
    let addedCount = 0;
    let alreadyExistsCount = 0;
    
    for (const teacher of teacherBins) {
      if (indexBin.teachers[teacher.username]) {
        console.log('⏭️ Lehrer bereits in Index:', teacher.username);
        alreadyExistsCount++;
        teacher.status = 'Bereits vorhanden';
      } else {
        indexBin.teachers[teacher.username] = teacher.binId;
        console.log('➕ Lehrer zur Index-Bin hinzugefügt:', teacher.username);
        addedCount++;
        teacher.status = 'Neu hinzugefügt';
      }
    }
    
    // 5. Speichere Index-Bin
    if (addedCount > 0) {
      await jsonbin.updateBin(indexBinId, indexBin);
      console.log('💾 Index-Bin aktualisiert');
    }
    
    return NextResponse.json({
      success: true,
      foundTeachers: teacherBins.length,
      alreadyInIndex: alreadyExistsCount,
      addedToIndex: addedCount,
      teachers: teacherBins
    });
  } catch (error) {
    console.error('❌ Migrations-Fehler:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Migrations-Fehler', 
        details: String(error) 
      },
      { status: 500 }
    );
  }
}

