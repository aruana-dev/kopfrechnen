# 🚂 Socket.io Server auf Railway.app deployen

## Schritt-für-Schritt Anleitung

### 1. Railway.app Setup

1. **Account erstellen:**
   - Gehe zu [railway.app](https://railway.app)
   - Sign up mit GitHub
   - Verifiziere deine Email

2. **Neues Projekt:**
   - Click "New Project"
   - Wähle "Deploy from GitHub repo"
   - Wähle dein `Kopfrechnen` Repository
   - Click "Deploy Now"

### 2. Service konfigurieren

Nach dem ersten Deploy:

1. **Settings** öffnen
2. **Root Directory** ändern:
   - Setze auf: `/server`
   - Speichern

3. **Build & Start Commands** (sollte auto-detect):
   - Build: `npm install`
   - Start: `npm start`

4. **Networking:**
   - Railway generiert automatisch eine Domain
   - Kopiere die URL (z.B. `https://kopfrechnen-production.up.railway.app`)

### 3. Vercel konfigurieren

In deinem **Vercel Projekt**:

1. **Settings** → **Environment Variables**
2. **Neue Variable hinzufügen:**
   - **Name:** `NEXT_PUBLIC_SOCKET_URL`
   - **Value:** `https://deine-railway-url.up.railway.app`
   - Für alle Environments (Production, Preview, Development)
3. **Redeploy** auslösen

### 4. Testen

1. **Öffne deine Vercel-URL**
2. **Gast-Modus** → Session erstellen
3. **Zweiter Tab** → Als Schüler beitreten
4. **Sollte funktionieren!** 🎉

## Railway Logs ansehen

- In Railway Dashboard → **Deployments**
- Click auf aktives Deployment
- **View Logs** → Siehst du alle Console-Logs
- Prüfe auf Fehler

## Kosten

**Railway Free Tier:**
- $5 Credits kostenlos/Monat
- ~500 Stunden Runtime
- Perfekt für Schulen!
- Sleep bei Inaktivität (spart Kosten)

## Troubleshooting

### Server startet nicht?
- Prüfe Logs in Railway Dashboard
- Stelle sicher, dass `server/package.json` existiert

### CORS Fehler?
In `server/index.js` CORS anpassen:
```javascript
cors: {
  origin: ['https://deine-vercel-url.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
}
```

### Verbindung funktioniert nicht?
- Prüfe ob `NEXT_PUBLIC_SOCKET_URL` in Vercel gesetzt ist
- Prüfe ob Railway Server läuft
- Öffne Browser Console (F12) → Siehst du "🔌 Verbinde zu Socket.io Server"?

## Alternative: Render.com

Falls Railway Probleme macht:

1. [render.com](https://render.com) → New Web Service
2. GitHub Repo verbinden
3. **Root Directory:** `server`
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. Free Tier wählen
7. URL kopieren und in Vercel als `NEXT_PUBLIC_SOCKET_URL` setzen

## Lokaler Dev-Server

Für lokale Entwicklung:
```bash
# Im Haupt-Projekt:
npm run dev

# Der Socket.io Server läuft automatisch mit
```

Railway/Render sind nur für Production nötig!

