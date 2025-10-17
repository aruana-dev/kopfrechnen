# Socket.io Server für Railway.app

Dieser Ordner enthält den separaten Socket.io Server für Live-Multiplayer-Sessions.

## Warum separat?

Vercel unterstützt keine WebSockets/Socket.io wegen serverless Functions. Daher wird der Socket.io Server separat auf Railway.app gehostet.

## Deployment auf Railway.app

### 1. Railway Account erstellen
- Gehe zu [railway.app](https://railway.app)
- Sign up / Login mit GitHub

### 2. Neues Projekt erstellen
- **"New Project"**
- **"Deploy from GitHub repo"**
- Wähle dein Kopfrechnen-Repository

### 3. Service konfigurieren
- **Root Directory**: Ändere zu `/server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 4. Domain erhalten
- Railway erstellt automatisch eine URL
- z.B. `https://your-app.up.railway.app`
- Diese URL kopieren!

### 5. Environment Variable in Vercel setzen

In deinem **Vercel Dashboard**:
- Settings → Environment Variables
- **Neue Variable:**
  - Name: `NEXT_PUBLIC_SOCKET_URL`
  - Value: `https://your-app.up.railway.app`
- **Redeploy** auslösen

## Lokales Testen

```bash
cd server
npm install
npm start
```

Server läuft auf `http://localhost:3001`

## Deployment

Railway deployt automatisch bei jedem Git Push!

## Kosten

Railway Free Tier:
- $5 kostenlos pro Monat
- 500 Stunden (mehr als genug für Schulen!)
- Automatisches Sleep bei Inaktivität

## Alternative: Render.com

Falls Railway nicht funktioniert, geht auch Render.com:
1. [render.com](https://render.com) → New Web Service
2. GitHub Repo verbinden
3. Root Directory: `server`
4. Start Command: `npm start`
5. Free Tier wählen

