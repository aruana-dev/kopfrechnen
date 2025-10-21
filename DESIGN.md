# 🎨 Design-Dokumentation: Kopfrechnen

## Konzept

**Kopfrechnen** ist eine interaktive Lern-App für Mathematik, inspiriert von Kahoot und Deutsch-Profi. Die App ermöglicht es Lehrkräften, spielerische Live-Sessions zu erstellen, bei denen Schüler in Echtzeit Rechenaufgaben lösen.

### Kernprinzipien
- **Gamification**: Spielerisches Lernen mit Punktesystem und Rangliste
- **Echtzeit-Interaktion**: Lehrer und Schüler agieren synchron via Socket.io
- **Mobile-First**: Optimiert für Tablets und Smartphones
- **Klarheit**: Intuitive Benutzeroberfläche ohne Ablenkung
- **Barrierefreiheit**: Große Buttons (min. 44x44px), klare Farbkontraste (WCAG 2.1 AA)

---

## Farbschema

### Primäre Farben
- **Primary (Blau)**: Tailwind `blue-500` (`#3B82F6`)
  - Verwendet für: Lehrer-Interface, Hauptaktionen
- **Secondary (Violett)**: Tailwind `purple-500` (`#8B5CF6`)
  - Verwendet für: Schüler-Interface, Akzente

### Rechenoperationen-Farben
Jede Rechenoperation hat eine eigene, konsistente Farbe:

| Operation | Farbe | Tailwind | Verwendung |
|-----------|-------|----------|------------|
| **Addition** | Blau | `blue-500` | + Aufgaben |
| **Subtraktion** | Grün | `green-500` | - Aufgaben |
| **Multiplikation** | Gelb | `yellow-500` | × Aufgaben |
| **Division** | Rot | `red-500` | ÷ Aufgaben |

### Status-Farben
- **Erfolg (Richtig)**: `green-500` (#10B981)
- **Fehler (Falsch)**: `red-500` (#EF4444)
- **Warnung**: `orange-500` (#F97316)
- **Info**: `blue-500` (#3B82F6)

### Hintergrund & Neutral
- **Lehrer-Seiten**: Gradient `from-primary-500 via-primary-600 to-primary-700`
- **Schüler-Seiten**: Gradient `from-secondary-500 via-secondary-600 to-secondary-700`
- **Startseite**: Gradient `from-primary-500 via-secondary-500 to-primary-600`
- **Card Background**: Weiß (#FFFFFF)
- **Glassmorphism**: `bg-white/10 backdrop-blur-lg border-white/20`
- **Text Primary**: `gray-900` (#111827)
- **Text Secondary**: `gray-600` (#4B5563)
- **Border**: `gray-200` (#E5E7EB)

---

## Typografie

### Schriftart
- **Font Family**: **Inter** (Google Fonts)
  - Weights: 300 (Light), 400 (Normal), 500 (Medium), 600 (Semibold), 700 (Bold)
  - Fallback: `-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif`

### Schriftgrößen
- **H1**: `text-5xl md:text-7xl lg:text-8xl` - Haupttitel
- **H2**: `text-2xl md:text-3xl` - Sektionen
- **H3**: `text-xl` - Karten-Titel
- **Body**: `text-base` (16px) - Fließtext
- **Small**: `text-sm` (14px) - Hinweise
- **Tiny**: `text-xs` (12px) - Metadaten

### Schriftstärken
- **Light**: `font-light` (300)
- **Normal**: `font-normal` (400)
- **Medium**: `font-medium` (500)
- **Semibold**: `font-semibold` (600)
- **Bold**: `font-bold` (700)

---

## Komponenten

### Buttons

#### Primary Button (`.btn-primary`)
```css
bg-primary-600 hover:bg-primary-700 text-white
font-semibold py-3 px-6 rounded-lg
transition-all duration-200 shadow-md hover:shadow-xl
focus:ring-2 focus:ring-primary-200
```

#### Secondary Button (`.btn-secondary`)
```css
bg-white hover:bg-gray-50 text-gray-900
border-2 border-gray-200 hover:border-gray-300
font-semibold py-3 px-6 rounded-lg
transition-all duration-200 shadow-md hover:shadow-xl
focus:ring-2 focus:ring-gray-200
```

#### Danger Button (`.btn-danger`)
```css
bg-red-600 hover:bg-red-700 text-white
font-semibold py-3 px-6 rounded-lg
transition-colors duration-200 shadow-md hover:shadow-xl
focus:ring-2 focus:ring-red-200
```

#### Success Button (`.btn-success`)
```css
bg-green-600 hover:bg-green-700 text-white
font-semibold py-3 px-6 rounded-lg
transition-colors duration-200 shadow-md hover:shadow-xl
focus:ring-2 focus:ring-green-200
```

#### Number Button (`.number-button`)
Für das Quiz-Nummernpad:
```css
w-full rounded-xl font-bold text-3xl
bg-gradient-to-br from-primary-500 to-primary-600
text-white shadow-lg
transition-all duration-200 hover:scale-105 active:scale-95
focus:ring-2 focus:ring-primary-200
```

### Cards

#### Standard Card (`.card`)
```css
bg-white rounded-xl shadow-md p-6
border border-gray-100
transition-all duration-200
```

#### Glassmorphism Card (`.card-glass`)
Für Overlays und transparente Inhalte:
```css
bg-white/10 backdrop-blur-lg rounded-2xl p-6
border border-white/20 shadow-2xl
```

### Input Fields (`.input-field`)
```css
w-full px-4 py-3
border-2 border-gray-200 rounded-lg
focus:border-primary-500 focus:ring-2 focus:ring-primary-200
transition-all duration-200 text-gray-900
```

### Session Code Display (`.session-code`)
```css
text-6xl font-bold tracking-wider
text-primary-600
```

---

## Layout

### Container
- **Standard**: `max-w-4xl mx-auto` für Config/Formulare
- **Breit**: `max-w-6xl mx-auto` für Dashboards/Übersichten

### Spacing
- **Padding (Mobile)**: `p-4`
- **Padding (Desktop)**: `p-6` oder `p-8`
- **Gap Klein**: `gap-2` (8px)
- **Gap Normal**: `gap-4` (16px)
- **Gap Groß**: `gap-6` (24px)

### Grid
- **2-Spalten**: `grid-cols-1 md:grid-cols-2`
- **3-Spalten**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **4-Spalten**: `grid-cols-2 md:grid-cols-4`

### Breakpoints (Tailwind Standard)
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

---

## Animationen & Transitions

### Standard Transitions
```css
transition-colors duration-200
transition-all duration-200
```

### Hover Effects
- **Buttons**: Farbwechsel + Schatten (`hover:shadow-xl`)
- **Cards**: Schatten-Vergrößerung + `hover:scale-103`
- **Interactive Elements**: `hover:scale-105 active:scale-95`

### Loading Spinner (`.spinner`)
```css
animate-spin rounded-full h-4 w-4
border-b-2 border-white
```

### Framer Motion
- **Initial States**: `opacity: 0`, `scale: 0.8-0.9`
- **Animate**: `opacity: 1`, `scale: 1`
- **Transitions**: `duration: 0.2-0.5s`
- **Hover**: `scale: 1.03-1.05`, `y: -2`
- **Tap**: `scale: 0.95-0.98`

---

## Responsive Design

### Mobile-First Approach
Die App ist primär für mobile Geräte (Tablets, Smartphones) optimiert.

### Anpassungen nach Breakpoint
- **Mobile (< 640px)**:
  - Volle Breite für Buttons
  - Single-Column Grid
  - Kompakte Padding (`p-4`)
  - Schriftgröße: `text-base` bis `text-xl`
  
- **Tablet (640px - 1024px)**:
  - 2-Spalten-Grid für Cards
  - Medium Padding (`p-6`)
  - Größere Schrift für bessere Lesbarkeit
  
- **Desktop (> 1024px)**:
  - Zentrierte Container mit `max-width`
  - 3+ Spalten-Grid für Dashboards
  - Large Padding (`p-8`)
  - Maximale Schriftgrößen

---

## Barrierefreiheit

### Kontraste (WCAG 2.1 Level AA)
Alle Farbkombinationen erfüllen die Mindestanforderungen:
- Weiße Schrift auf farbigem Hintergrund: **Mindestens 4.5:1**
- Farbige Schrift auf weißem Hintergrund: **Mindestens 3:1**

### Interaktion
- **Touch-Targets**: Mindestens **44x44px** (`.touch-target` Utility-Class)
- **Fokus-Indikatoren**: `focus:ring-2 focus:ring-[color]-200`
- **Tastatur-Navigation**: Alle interaktiven Elemente via Tab erreichbar
- **Skip to Main Content**: Verfügbar via Tab (`.skip-to-main`)

### Semantisches HTML
- Korrekte Verwendung von `<button>`, `<input>`, `<label>`
- Strukturierung mit `<h1>`, `<h2>`, `<h3>`
- Landmarks: `<main>`, `<nav>`, `<aside>`

---

## User Experience

### Feedback-Mechanismen

#### Visuelles Feedback
- **Richtige Antwort**: Grüner Haken + grüner Border
- **Falsche Antwort**: Rotes X + roter Border
- **Loading States**: Spinner + Status-Text
- **Progress Updates**: Real-time via Socket.io

#### Status-Anzeigen
- **Session-Code**: Groß und zentriert (`text-6xl`)
- **Spieler-Liste**: Live-Updates via WebSocket
- **Fortschritt**: "Aufgabe X von Y"
- **Timer**: Countdown mit visueller Anzeige

### Navigation
- **"Zurück zum Dashboard"** Links auf allen Schüler-Seiten
- **Logout** Button gut sichtbar
- **Abbrechen** Optionen für laufende Sessions

---

## Rollen & Farbzuweisung

### Lehrer-Seiten
- **Gradient**: `from-primary-500 via-primary-600 to-primary-700` (Blau)
- **Akzentfarbe**: `primary-600`
- **Buttons**: `btn-primary`, `btn-danger`
- **Identifikation**: `data-role="teacher"` Attribut

### Schüler-Seiten
- **Gradient**: `from-secondary-500 via-secondary-600 to-secondary-700` (Violett)
- **Akzentfarbe**: `secondary-600`
- **Buttons**: `btn-success`, `number-button`
- **Identifikation**: `data-role="student"` Attribut

---

## Icons & Emojis

Verwendete Emojis für schnelles visuelles Feedback:

- 🧮: App-Logo (Kopfrechnen)
- 🎯: Schüler-Code Eingabe
- 🎓: Session beitreten
- 👨‍🏫: Lehrer-Bereich
- 🔐: Login
- 👤: Gast-Modus
- ✓: Richtige Antwort
- ✗: Falsche Antwort
- ⏱️: Timer
- 🏆: Rangliste/Gewinner
- 📊: Statistiken/Ergebnisse
- 📚: Übungen/Sessions
- ✏️: Aufgaben
- ⭐: Punkte
- ⚡: Geschwindigkeit
- 🎉: Erfolg/Abschluss

---

## Technische Details

### CSS Framework
**Tailwind CSS 3.3.0**
- Utility-First Approach
- JIT (Just-In-Time) Compiler
- Custom Configuration in `tailwind.config.ts`

### Farb-Erweiterungen
```ts
colors: {
  primary: colors.blue,
  secondary: colors.purple,
  success: colors.green,
  danger: colors.red,
  warning: colors.orange,
}
```

### Custom CSS
Utility Classes in `app/globals.css`:
- `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`
- `.card`, `.card-glass`
- `.input-field`
- `.number-button`
- `.session-code`
- `.spinner`
- `.touch-target`
- `.skip-to-main`

### Body Background Logic
```css
/* Default: Neutral gradient */
body { bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 }

/* Teacher pages: Primary gradient */
body:has([data-role="teacher"]) { bg-gradient-to-br from-primary-500... }

/* Student pages: Secondary gradient */
body:has([data-role="student"]) { bg-gradient-to-br from-secondary-500... }
```

---

## Zukünftige Erweiterungen

### Geplante Features
- **Dark Mode**: Alternative Farbschemata für Nachtmodus
- **Themes**: Anpassbare Farbschemata pro Schule/Klasse
- **Accessibility Mode**: Hochkontrast-Modus
- **Animationen**: Konfetti bei Erfolg, subtile Micro-Interactions
- **Sound Effects**: Audio-Feedback für richtige/falsche Antworten
- **Progress Bar**: Visuelle Fortschrittsanzeige mit Animationen

### Design-Optimierungen
- **Illustrations**: Eigene Icons/Illustrationen für Operationen
- **Achievement Badges**: Gamification-Elemente
- **Leaderboard**: Top-Schüler Anzeige
- **Mini-Games**: Erweiterte Wartespiele (z.B. Series Catcher)

---

## Branding

### Farbidentität
- **Primär (Blau)**: Vertrauen, Intelligenz, Lernen
- **Sekundär (Violett)**: Kreativität, Inspiration, Spaß
- **Akzent (Grün)**: Erfolg, Wachstum, positive Verstärkung

### Tone of Voice
- **Freundlich**: "Lerne spielerisch rechnen"
- **Motivierend**: "Werde zum Kopfrechnen-Profi"
- **Klar**: Präzise Anweisungen ohne Fachjargon
- **Gamifiziert**: Spielerische Elemente, Ranglisten, Punkte

---

**Version**: 2.0  
**Letzte Aktualisierung**: Oktober 2025  
**Basierend auf**: Deutsch-Profi Design System  
**Framework**: Next.js 14 + Tailwind CSS 3 + Framer Motion

