import { NextRequest, NextResponse } from 'next/server';
import { jsonbin } from '@/lib/jsonbin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { username, newPassword } = await request.json();

    if (!username || !newPassword) {
      return NextResponse.json(
        { error: 'Username und Passwort erforderlich' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 6 Zeichen lang sein' },
        { status: 400 }
      );
    }

    console.log('🔐 Admin: Passwort-Reset für:', username);

    // 1. Finde den Lehrer im Index-Bin
    const indexBinId = await (jsonbin as any).getOrCreateIndexBin();
    const indexBin = await jsonbin.readBin(indexBinId);

    if (!indexBin.teachers || !indexBin.teachers[username]) {
      return NextResponse.json(
        { error: `Lehrer "${username}" nicht gefunden` },
        { status: 404 }
      );
    }

    const teacherBinId = indexBin.teachers[username];
    console.log('✅ Lehrer-Bin gefunden:', teacherBinId);

    // 2. Lade den Teacher
    const teacher = await jsonbin.readBin(teacherBinId);

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher-Bin konnte nicht geladen werden' },
        { status: 500 }
      );
    }

    console.log('📦 Aktueller Teacher:', {
      id: teacher.id,
      username: teacher.username,
      hasPasswordHash: !!teacher.passwordHash,
    });

    // 3. Generiere neues Passwort-Hash
    const newPasswordHash = await (jsonbin as any).hashPassword(newPassword);
    console.log('🔑 Neues Password-Hash generiert');

    // 4. Update Teacher mit neuem Password
    const updatedTeacher = {
      ...teacher,
      passwordHash: newPasswordHash,
      passwordResetAt: Date.now(),
    };

    await jsonbin.updateBin(teacherBinId, updatedTeacher);
    console.log('✅ Teacher aktualisiert mit neuem Passwort');

    return NextResponse.json({
      success: true,
      message: `Passwort für "${username}" erfolgreich zurückgesetzt!`,
      teacherBinId,
    });

  } catch (error: any) {
    console.error('❌ Admin: Passwort-Reset Fehler:', error);
    return NextResponse.json(
      { error: error.message || 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

