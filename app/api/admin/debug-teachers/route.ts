import { NextResponse } from 'next/server';
import { jsonbin } from '@/lib/jsonbin';

export async function GET() {
  try {
    console.log('🔍 Debug: Lade Index-Bin für Lehrer-Debug');
    
    // Hole Index-Bin ID (private Methode, daher müssen wir es über getOrCreateIndexBin machen)
    const indexBinId = await (jsonbin as any).getOrCreateIndexBin();
    console.log('📦 Index-Bin ID:', indexBinId);
    
    // Lade Index-Bin Daten
    const indexBinData = await jsonbin.readBin(indexBinId);
    console.log('📦 Index-Bin Daten:', indexBinData);
    
    const teachers = indexBinData.teachers || {};
    console.log('👨‍🏫 Lehrer in Index:', Object.keys(teachers));
    
    // Lade Details für jeden Lehrer
    const teacherDetails: any = {};
    for (const [username, binId] of Object.entries(teachers)) {
      try {
        const teacherData = await jsonbin.readBin(binId as string);
        teacherDetails[binId as string] = {
          username: teacherData.username,
          klassen: teacherData.klassen,
          created: teacherData.created
        };
      } catch (error) {
        console.error(`❌ Fehler beim Laden von Lehrer ${username}:`, error);
        teacherDetails[binId as string] = { error: 'Konnte nicht geladen werden' };
      }
    }
    
    return NextResponse.json({
      success: true,
      indexBinId,
      teachers,
      teacherDetails,
      indexBinData
    });
  } catch (error) {
    console.error('❌ Debug-Teachers Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Lehrer-Daten', details: String(error) },
      { status: 500 }
    );
  }
}

