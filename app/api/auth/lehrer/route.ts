import { NextRequest, NextResponse } from 'next/server';
import { jsonbin } from '@/lib/jsonbin';

export async function POST(request: NextRequest) {
  try {
    const { username, password, mode } = await request.json();
    
    console.log('🔐 API: Lehrer-Auth-Request:', { username, mode });
    
    if (!username || !password) {
      console.log('❌ API: Fehlende Credentials');
      return NextResponse.json(
        { error: 'Benutzername und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    if (mode === 'register') {
      console.log('📝 API: Registrierung gestartet');
      // Prüfe ob Benutzername bereits existiert
      const usernameExists = await jsonbin.checkUsernameExists(username);
      if (usernameExists) {
        console.log('❌ API: Benutzername bereits vergeben');
        return NextResponse.json(
          { error: 'Benutzername bereits vergeben' },
          { status: 409 }
        );
      }

      console.log('✅ API: Registriere neuen Lehrer');
      // Registriere neuen Lehrer
      const teacher = await jsonbin.registerTeacher(username, password);
      console.log('✅ API: Lehrer registriert:', teacher.id);
      
      // Erstelle Session-Token
      const sessionToken = `lehrer_${teacher.id}_${Date.now()}`;
      const sessionData = {
        teacherId: teacher.id,
        username: teacher.username,
        token: sessionToken,
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 Stunden
      };

      const response = NextResponse.json({
        success: true,
        teacher: {
          id: teacher.id,
          username: teacher.username,
          klassen: teacher.klassen
        }
      });

      response.cookies.set('lehrer_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24 Stunden in Sekunden
      });

      return response;
    } else {
      // Login
      console.log('🔑 API: Login-Versuch für:', username);
      const teacher = await jsonbin.loginTeacher(username, password);
      
      if (!teacher) {
        console.log('❌ API: Login fehlgeschlagen - Ungültige Credentials');
        return NextResponse.json(
          { error: 'Ungültiger Benutzername oder Passwort' },
          { status: 401 }
        );
      }
      
      console.log('✅ API: Login erfolgreich:', teacher.id);

      // Erstelle Session-Token
      const sessionToken = `lehrer_${teacher.id}_${Date.now()}`;
      const sessionData = {
        teacherId: teacher.id,
        username: teacher.username,
        token: sessionToken,
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 Stunden
      };

      const response = NextResponse.json({
        success: true,
        teacher: {
          id: teacher.id,
          username: teacher.username,
          klassen: teacher.klassen
        }
      });

      response.cookies.set('lehrer_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24 Stunden in Sekunden
      });

      return response;
    }
  } catch (error) {
    console.error('Lehrer-Authentifizierung Fehler:', error);
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('lehrer_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const sessionData = JSON.parse(sessionCookie.value);
    
    // Prüfe Ablaufzeit
    if (sessionData.expires < Date.now()) {
      return NextResponse.json(
        { error: 'Session abgelaufen' },
        { status: 401 }
      );
    }

    // Lade aktuelle Lehrer-Daten
    const teacher = await jsonbin.readBin(sessionData.teacherId);
    if (!teacher) {
      return NextResponse.json(
        { error: 'Lehrer nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        username: teacher.username,
        klassen: teacher.klassen || []
      }
    });
  } catch (error) {
    console.error('Lehrer-Session-Validierung Fehler:', error);
    return NextResponse.json(
      { error: 'Session ungültig' },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('lehrer_session');
  return response;
}
