// JSONBin.io API Client
// Dokumentation: https://jsonbin.io/api-reference

// Lade API Key - handle $ escaping
const rawKey = process.env.NEXT_PUBLIC_JSONBIN_API_KEY || '';
const JSONBIN_API_KEY = rawKey.trim();
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3';

// Zentrale Index-Bin-ID für Code-Mappings (wird beim ersten Schüler erstellt)
// Format: { schuelerCodes: { "ABCD12": "klasseBinId", ... } }
const INDEX_BIN_ID_KEY = 'kopfrechnen_index_bin_id';

// Verwende Environment Variable wenn verfügbar (für Production!)
const INDEX_BIN_ID_FROM_ENV = typeof process !== 'undefined' 
  ? process.env.NEXT_PUBLIC_INDEX_BIN_ID 
  : null;

// Debug: API Key Status
if (typeof window !== 'undefined') {
  console.log('API Key Status:', JSONBIN_API_KEY ? '✅ Vorhanden' : '❌ Fehlt');
  console.log('API Key Länge:', JSONBIN_API_KEY.length, 'Zeichen');
  console.log('API Key komplett:', JSONBIN_API_KEY);
  console.log('API Key Start:', JSONBIN_API_KEY.substring(0, 20));
  if (!JSONBIN_API_KEY) {
    console.error('⚠️ JSONBIN_API_KEY nicht gesetzt! Bitte .env.local erstellen.');
  }
  if (JSONBIN_API_KEY && !JSONBIN_API_KEY.startsWith('$2')) {
    console.error('⚠️ API Key scheint unvollständig! Sollte mit $2a$ oder $2b$ beginnen.');
  }
}

export interface Teacher {
  id: string;
  username: string;
  passwordHash: string;
  created: number;
  klassen: string[]; // IDs der Klassen
}

export interface Klasse {
  id: string;
  name: string;
  teacherId: string;
  schueler: Schueler[];
  sessions: SessionResult[];
  created: number;
}

export interface Schueler {
  id: string;
  code: string; // Eindeutiger Schüler-Code
  vorname: string; // Nur für Lehrer sichtbar
  klasseId: string;
  created: number;
}

export interface SessionResult {
  sessionId: string;
  datum: number;
  settings: any;
  ergebnisse: {
    schuelerCode: string;
    nickname: string;
    punkte: number;
    gesamtZeit: number;
    durchschnittsZeit: number;
    antworten: any[];
  }[];
}

class JSONBinClient {
  private getHeaders(): HeadersInit {
    if (!JSONBIN_API_KEY) {
      throw new Error('JSONBin API Key fehlt! Bitte .env.local erstellen.');
    }
    
    return {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_API_KEY,
    };
  }

  // Bin erstellen
  async createBin(data: any, name?: string): Promise<{ id: string; record: any }> {
    console.log('🔑 Erstelle Bin mit Key:', JSONBIN_API_KEY.substring(0, 10) + '...');
    
    const headers = {
      ...this.getHeaders(),
      ...(name && { 'X-Bin-Name': name }),
    };

    console.log('📤 Headers:', Object.keys(headers));

    const response = await fetch(`${JSONBIN_BASE_URL}/b`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    console.log('📥 Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ JSONBin Error:', errorText);
      throw new Error(`JSONBin API Error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Bin erstellt:', result.metadata?.id);
    return { id: result.metadata.id, record: result.record };
  }

  // Bin lesen
  async readBin(binId: string): Promise<any> {
    const response = await fetch(`${JSONBIN_BASE_URL}/b/${binId}/latest`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`JSONBin API Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.record;
  }

  // Bin aktualisieren
  async updateBin(binId: string, data: any): Promise<any> {
    const response = await fetch(`${JSONBIN_BASE_URL}/b/${binId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`JSONBin API Error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.record;
  }

  // Alle Bins auflisten
  async listBins(): Promise<any[]> {
    try {
      const response = await fetch(`${JSONBIN_BASE_URL}/b`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error('ListBins Error:', response.status, response.statusText);
        return [];
      }

      const result = await response.json();
      console.log('ListBins Result:', result);
      return result || [];
    } catch (error) {
      console.error('ListBins Exception:', error);
      return [];
    }
  }

  // Einfache Hash-Funktion für Passwörter (in Production: bcrypt verwenden!)
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Lehrer registrieren
  async registerTeacher(username: string, password: string): Promise<Teacher> {
    const passwordHash = await this.hashPassword(password);
    const teacher: Teacher = {
      id: `teacher_${Date.now()}`,
      username,
      passwordHash,
      created: Date.now(),
      klassen: [],
    };

    const { id } = await this.createBin(teacher, `teacher_${username}`);
    
    // Speichere Bin-ID im localStorage für Login
    if (typeof window !== 'undefined') {
      const teacherMap = JSON.parse(localStorage.getItem('teacherBins') || '{}');
      teacherMap[username] = id;
      localStorage.setItem('teacherBins', JSON.stringify(teacherMap));
    }
    
    return { ...teacher, id };
  }

  // Lehrer einloggen
  async loginTeacher(username: string, password: string): Promise<Teacher | null> {
    console.log('Login-Versuch für:', username);
    
    try {
      // Hole Bin-ID aus localStorage
      let binId: string | null = null;
      
      if (typeof window !== 'undefined') {
        const teacherMap = JSON.parse(localStorage.getItem('teacherBins') || '{}');
        binId = teacherMap[username];
        console.log('Bin-ID aus localStorage:', binId);
      }
      
      if (!binId) {
        console.error('Keine Bin-ID für', username, 'gefunden. Bitte neu registrieren.');
        return null;
      }
      
      // Lade Teacher-Daten
      const teacher = await this.readBin(binId);
      
      if (!teacher) {
        console.error('Teacher-Bin nicht gefunden:', binId);
        return null;
      }
      
      // Prüfe Passwort
      const passwordHash = await this.hashPassword(password);
      console.log('Password Check:', teacher.passwordHash === passwordHash);

      if (teacher.passwordHash === passwordHash) {
        return { ...teacher, id: binId };
      }

      return null;
    } catch (error) {
      console.error('Login Error:', error);
      return null;
    }
  }

  // Klasse erstellen
  async createKlasse(teacherId: string, name: string): Promise<Klasse> {
    const klasse: Klasse = {
      id: `klasse_${Date.now()}`,
      name,
      teacherId,
      schueler: [],
      sessions: [],
      created: Date.now(),
    };

    const { id } = await this.createBin(klasse, `klasse_${name}_${Date.now()}`);
    return { ...klasse, id };
  }

  // Schüler-Codes generieren
  generateSchuelerCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Ohne I, O, 0, 1
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  // Hole oder erstelle Index-Bin
  private async getOrCreateIndexBin(): Promise<string> {
    // WICHTIG: Wir brauchen einen FESTEN Index-Bin für die ganze App!
    
    // 1. Versuche aus Environment Variable (Production)
    if (INDEX_BIN_ID_FROM_ENV) {
      console.log('📦 Verwende Index-Bin-ID aus Environment:', INDEX_BIN_ID_FROM_ENV);
      return INDEX_BIN_ID_FROM_ENV;
    }
    
    // 2. Versuche aus localStorage (Local Dev)
    let indexBinId: string | null = null;
    
    if (typeof window !== 'undefined') {
      indexBinId = localStorage.getItem(INDEX_BIN_ID_KEY);
      console.log('📦 Index-Bin-ID aus localStorage:', indexBinId);
    }

    // 3. Wenn vorhanden, prüfe ob noch gültig
    if (indexBinId) {
      try {
        const index = await this.readBin(indexBinId);
        if (index && index.type === 'kopfrechnen_index') {
          console.log('✅ Index-Bin gefunden und gültig');
          return indexBinId;
        }
      } catch (error) {
        console.log('⚠️ Index-Bin nicht mehr gültig');
      }
    }

    // 4. Erstelle neuen Index-Bin (nur für lokale Entwicklung)
    console.log('➕ Erstelle neuen Index-Bin...');
    const indexData = {
      type: 'kopfrechnen_index',
      schuelerCodes: {},
      created: Date.now(),
      version: '1.0',
    };

    const { id } = await this.createBin(indexData, 'kopfrechnen_schueler_index_v1');
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(INDEX_BIN_ID_KEY, id);
    }

    console.log('✅ Neuer Index-Bin erstellt:', id);
    console.log('⚠️ WICHTIG: Für Production diese ID als NEXT_PUBLIC_INDEX_BIN_ID setzen!');

    return id;
  }

  // Code-Mapping zum Index hinzufügen
  private async addCodeMapping(code: string, klasseBinId: string): Promise<void> {
    const indexBinId = await this.getOrCreateIndexBin();
    const index = await this.readBin(indexBinId);
    
    index.schuelerCodes[code] = klasseBinId;
    await this.updateBin(indexBinId, index);
  }

  // Klasse für Code finden
  async findKlasseBySchuelerCode(code: string): Promise<{ klasse: Klasse; binId: string } | null> {
    try {
      const indexBinId = await this.getOrCreateIndexBin();
      const index = await this.readBin(indexBinId);
      
      const klasseBinId = index.schuelerCodes[code];
      
      if (!klasseBinId) {
        console.log('Code nicht im Index gefunden:', code);
        return null;
      }

      const klasse = await this.readBin(klasseBinId);
      
      if (!klasse) {
        console.log('Klasse nicht gefunden für Bin-ID:', klasseBinId);
        return null;
      }

      return { klasse, binId: klasseBinId };
    } catch (error) {
      console.error('Fehler beim Suchen der Klasse:', error);
      return null;
    }
  }

  // Schüler zur Klasse hinzufügen (mit Vornamen)
  async addSchuelerToKlasse(klasseBinId: string, vornamen: string[]): Promise<Schueler[]> {
    const klasse = await this.readBin(klasseBinId);
    const neueSchueler: Schueler[] = [];

    for (let i = 0; i < vornamen.length; i++) {
      const code = this.generateSchuelerCode();
      const schueler: Schueler = {
        id: `schueler_${Date.now()}_${i}`,
        code,
        vorname: vornamen[i].trim(),
        klasseId: klasse.id,
        created: Date.now(),
      };
      neueSchueler.push(schueler);
      
      // Füge Code-Mapping zum Index hinzu
      await this.addCodeMapping(code, klasseBinId);
    }

    klasse.schueler.push(...neueSchueler);
    await this.updateBin(klasseBinId, klasse);

    return neueSchueler;
  }

  // Schüler bearbeiten
  async updateSchueler(klasseBinId: string, schuelerUpdate: Partial<Schueler> & { id: string }): Promise<void> {
    const klasse = await this.readBin(klasseBinId);
    const index = klasse.schueler.findIndex((s: Schueler) => s.id === schuelerUpdate.id);
    
    if (index !== -1) {
      klasse.schueler[index] = { ...klasse.schueler[index], ...schuelerUpdate };
      await this.updateBin(klasseBinId, klasse);
    }
  }

  // Schüler löschen
  async deleteSchueler(klasseBinId: string, schuelerId: string): Promise<void> {
    const klasse = await this.readBin(klasseBinId);
    const schueler = klasse.schueler.find((s: Schueler) => s.id === schuelerId);
    
    if (schueler) {
      // Entferne Code aus Index
      try {
        const indexBinId = await this.getOrCreateIndexBin();
        const index = await this.readBin(indexBinId);
        delete index.schuelerCodes[schueler.code];
        await this.updateBin(indexBinId, index);
      } catch (error) {
        console.error('Fehler beim Aktualisieren des Index:', error);
      }
    }
    
    klasse.schueler = klasse.schueler.filter((s: Schueler) => s.id !== schuelerId);
    
    // Auch alle Sessions dieses Schülers löschen
    klasse.sessions = klasse.sessions.filter((session: SessionResult) => {
      session.ergebnisse = session.ergebnisse.filter((erg: any) => {
        const schueler = klasse.schueler.find((s: Schueler) => s.code === erg.schuelerCode);
        return schueler !== undefined;
      });
      return session.ergebnisse.length > 0;
    });
    
    await this.updateBin(klasseBinId, klasse);
  }

  // Session eines Schülers löschen
  async deleteSchuelerSession(klasseBinId: string, schuelerCode: string, sessionId: string): Promise<void> {
    const klasse = await this.readBin(klasseBinId);
    const session = klasse.sessions.find((s: SessionResult) => s.sessionId === sessionId);
    
    if (session) {
      session.ergebnisse = session.ergebnisse.filter((erg: any) => erg.schuelerCode !== schuelerCode);
      
      // Wenn Session keine Ergebnisse mehr hat, ganz löschen
      if (session.ergebnisse.length === 0) {
        klasse.sessions = klasse.sessions.filter((s: SessionResult) => s.sessionId !== sessionId);
      }
    }
    
    await this.updateBin(klasseBinId, klasse);
  }

  // Session-Ergebnis speichern
  async saveSessionResult(klasseBinId: string, result: SessionResult): Promise<void> {
    const klasse = await this.readBin(klasseBinId);
    klasse.sessions.push(result);
    await this.updateBin(klasseBinId, klasse);
  }

  // Lehrer-Passwort ändern
  async updateTeacherPassword(teacherBinId: string, newPassword: string): Promise<void> {
    const teacher = await this.readBin(teacherBinId);
    teacher.passwordHash = await this.hashPassword(newPassword);
    await this.updateBin(teacherBinId, teacher);
  }

  // Lehrer-Benutzername ändern
  async updateTeacherUsername(teacherBinId: string, oldUsername: string, newUsername: string): Promise<void> {
    // Prüfe ob neuer Username schon existiert
    if (typeof window !== 'undefined') {
      const teacherMap = JSON.parse(localStorage.getItem('teacherBins') || '{}');
      if (teacherMap[newUsername] && teacherMap[newUsername] !== teacherBinId) {
        throw new Error('Benutzername bereits vergeben!');
      }
    }

    // Update Teacher-Objekt
    const teacher = await this.readBin(teacherBinId);
    teacher.username = newUsername;
    await this.updateBin(teacherBinId, teacher);

    // Update localStorage mapping
    if (typeof window !== 'undefined') {
      const teacherMap = JSON.parse(localStorage.getItem('teacherBins') || '{}');
      delete teacherMap[oldUsername]; // Alte Zuordnung löschen
      teacherMap[newUsername] = teacherBinId; // Neue Zuordnung
      localStorage.setItem('teacherBins', JSON.stringify(teacherMap));
    }
  }
}

export const jsonbin = new JSONBinClient();

