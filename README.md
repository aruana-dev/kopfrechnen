# 🧮 Kopfrechnen - Live Quiz App

Eine interaktive Web-App für Kopfrechnen im Unterricht - ähnlich wie Kahoot!

## 🎯 Modi

Die App bietet **zwei Hauptmodi**:

### 1. Gast-Modus (Schnellstart)
- Sofort starten ohne Anmeldung
- Ideal für spontane Sessions
- Keine Datenspeicherung

### 2. Konto-Modus (mit JSONBin.io)
- Lehrer-Account mit Login
- Klassen-Verwaltung
- Schüler-Codes generieren & verwalten
- Fortschritt-Tracking aller Sessions
- PDF-Export für Schüler-Codes

## Features

### Für Lehrkräfte 👨‍🏫
- **Session-Erstellung** mit vielen Einstellungen:
  - Reihen auswählen (1er bis 12er)
  - Operationen: Addition, Subtraktion, Multiplikation, Division
  - Schwierigkeit: Anzahl Aufgaben, Anzahl Stellen (1-6), Kommastellen, Minuswerte
  - Tempo: Vorgegeben oder frei
  - **NEU:** Direkt weiter (automatisch zur nächsten Aufgabe nach Stellen-Anzahl)
- **Live-Lobby** mit Session-Code und Teilnehmer-Anzeige
- **Sound-Effekte** (optional): Hintergrundmusik, Join-Sounds, Countdown, Applaus
- **Echtzeit-Fortschritt** während des Quiz
- **Rangliste** mit Punkten und Zeiten (bei gleicher Punktzahl zählt die Zeit!)
- **Revanche-Modus** mit Platzvergleich und Zeitverbesserung

### Für Schüler 🎓
- **Session beitreten** mit Session-Code (Gast-Modus)
- **Login mit Schüler-Code** (Konto-Modus)
- **Eigene Lern-Sessions** starten zum Üben
- **Nickname** für Anonymität in der Rangliste
- **Großes Nummernpad** für Touch-Bedienung
- **Aufgaben lösen** im eigenen Tempo oder mit Zeitlimit
- **Live-Ergebnisse** am Ende

## Technologie-Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Animationen**: Framer Motion
- **Echtzeit**: Socket.io
- **State Management**: Zustand

## Installation

1. Abhängigkeiten installieren:
```bash
npm install
```

2. Entwicklungsserver starten:
```bash
npm run dev
```

Dies startet:
- Next.js App auf `http://localhost:3000`
- Socket.io Server auf `http://localhost:3001`

## Verwendung

1. **Als Lehrkraft**:
   - Auf "Lehrkraft" klicken
   - Session-Einstellungen vornehmen
   - Session erstellen
   - Session-Code an Schüler weitergeben
   - Quiz starten

2. **Als Schüler**:
   - Auf "Schüler" klicken
   - Session-Code eingeben
   - Namen eingeben
   - Auf Start warten
   - Aufgaben lösen

## Design

Die App orientiert sich am beliebten Kahoot-Design:
- Bunte Farben (Lila, Blau, Grün, Pink)
- Große, touch-freundliche Buttons
- Animationen für besseres Feedback
- Mobile-First Ansatz

## Entwicklung

Projekt-Struktur:
```
├── app/                    # Next.js App Router
│   ├── teacher/           # Lehrkraft-Seiten
│   ├── student/           # Schüler-Seiten
│   └── results/           # Ergebnis-Seite
├── components/            # Wiederverwendbare Komponenten
├── hooks/                 # Custom React Hooks
├── lib/                   # Hilfsfunktionen
├── store/                 # Zustand Store
├── types/                 # TypeScript Typen
└── server.ts             # Socket.io Server
```

## Scripts

- `npm run dev` - Startet Frontend und Backend im Dev-Modus
- `npm run dev:next` - Nur Frontend
- `npm run dev:server` - Nur Backend
- `npm run build` - Build für Produktion
- `npm start` - Startet Produktion-Build

## Sound-System 🔊

Die App unterstützt optionale Sound-Effekte! Legen Sie Sound-Dateien im Ordner `public/sounds/` ab:

### Verfügbare Sounds:
- `background.mp3` - Hintergrundmusik in der Lobby
- `waiting.mp3` - Wartemusik
- `join.mp3` - Sound wenn Teilnehmer beitritt
- `countdown.mp3` - Countdown-Sound (10-9-8...)
- `start.mp3` - Quiz-Start
- `applause.mp3` - Applaus bei Ergebnissen
- `winner.mp3` - Sound für Platz 1
- `celebration.mp3` - Feier-Sound

**Hinweis:** Alle Sounds sind optional. Die App funktioniert auch ohne Sounds. Sounds werden nur auf dem Lehrer-Tab abgespielt.

Siehe `public/sounds/README.md` für Details.

## Konto-Modus Setup 🔐

### JSONBin.io API Key einrichten

1. Erstellen Sie einen **kostenlosen Account** auf [jsonbin.io](https://jsonbin.io)
2. Kopieren Sie Ihren **API Master Key**
3. Erstellen Sie eine `.env.local` Datei im Projekt-Root:
   ```
   NEXT_PUBLIC_JSONBIN_API_KEY=your_api_key_here
   ```

### Features im Konto-Modus

#### Für Lehrkräfte:
- **Registrierung/Login** mit Benutzername & Passwort
- **Dashboard** mit Klassen-Übersicht
- **Klassen erstellen** und verwalten
- **Schüler-Codes generieren** (automatisch, 6-stellig)
- **PDF-Export** der Schüler-Codes zum Ausdrucken
- **Fortschritt-Tracking** aller Sessions
- **Session-Historie** mit detaillierten Ergebnissen

#### Für Schüler:
- **Login mit Schüler-Code** (von Lehrkraft erhalten)
- **Nickname wählen** bei jeder Session (Anonymität!)
- **Eigene Lern-Sessions** starten
- **Individuelle Übung** nach eigenen Einstellungen
- Ergebnisse werden automatisch gespeichert

## Neue Features ✨

### Direkt-Weiter-Modus
Wenn aktiviert, geht es automatisch zur nächsten Aufgabe, sobald die erwartete Anzahl Stellen eingegeben wurde (z.B. bei 3×4=12 nach 2 Stellen).

### Revanche-Modus
Nach einer Session kann der Lehrer eine Revanche mit denselben Einstellungen starten. Die Ergebnisse zeigen dann:
- ↑/↓ Platzveränderungen
- ⚡/🐌 Zeitverbesserung oder -verschlechterung

### Sortierung
Bei gleicher Anzahl richtiger Antworten gewinnt die kürzere Gesamtzeit!

## Architektur 🏗️

### Frontend
- **Next.js 14** (App Router)
- **TypeScript** für Type Safety
- **Tailwind CSS** für Styling
- **Framer Motion** für Animationen

### Backend
- **Socket.io** für Echtzeit-Kommunikation
- **JSONBin.io** für Cloud-Datenspeicherung (Konto-Modus)
- **Zustand** für State Management

### Datenspeicherung

#### Gast-Modus:
- Keine persistente Speicherung
- Daten nur während der Session

#### Konto-Modus (JSONBin.io):
- **Lehrer-Accounts** (Username, Password-Hash)
- **Klassen** (Name, Schüler-Codes, Sessions)
- **Session-Ergebnisse** (Nickname, Code, Punkte, Zeiten)
- Alle Daten verschlüsselt übertragen

## Workflow-Beispiel 📋

### Konto-Modus Workflow:

1. **Lehrkraft registriert sich** → Dashboard
2. **Klasse erstellen** (z.B. "5a")
3. **Schüler hinzufügen** (z.B. 25 Schüler) → Codes generiert
4. **PDF exportieren** → an Schüler verteilen
5. **Session starten** mit Einstellungen
6. **Schüler treten bei:**
   - Mit Schüler-Code einloggen
   - Nickname wählen
   - Session-Code eingeben
7. **Quiz läuft** → Echtzeit-Fortschritt
8. **Ergebnisse** → automatisch in Klasse gespeichert
9. **Fortschritt ansehen** → alle Sessions & Schüler-Performance

### Schüler Selbst-Lernen:

1. **Mit Schüler-Code einloggen**
2. **Nickname wählen**
3. **"Selbst lernen"** wählen
4. **Einstellungen anpassen** (Reihen, Operationen, Anzahl)
5. **Üben!** → Ergebnis wird gespeichert

## Lizenz

Privates Projekt für Bildungszwecke.

