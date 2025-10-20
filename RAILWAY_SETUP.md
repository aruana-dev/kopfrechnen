# 🚂 Railway Deployment Setup

## Schritt 1: Railway Account & Projekt erstellen

1. Gehe zu https://railway.app/
2. Logge dich ein (GitHub Login empfohlen)
3. Klicke auf "New Project"
4. Wähle "Deploy from GitHub repo"
5. Verbinde dein GitHub Repository

## Schritt 2: Environment Variables setzen

In den Railway Project Settings → Variables, füge folgende hinzu:

```bash
# JSONBin API Key (erforderlich)
NEXT_PUBLIC_JSONBIN_API_KEY=dein_api_key_hier

# JSONBin Index Bin ID (erforderlich)
NEXT_PUBLIC_INDEX_BIN_ID=deine_bin_id_hier

# Socket.io URL (wird automatisch gesetzt, aber du kannst es überschreiben)
NEXT_PUBLIC_SOCKET_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Node Environment
NODE_ENV=production
```

## Schritt 3: Socket.io Server auf Railway deployen

### Option A: Separates Service für Socket.io (EMPFOHLEN)

1. Klicke in deinem Railway Projekt auf "+ New"
2. Wähle "GitHub Repo" und verbinde dasselbe Repository
3. In den Service Settings:
   - **Root Directory**: `server`
   - **Start Command**: `node index.js`
   - **Port**: `3001` (automatisch erkannt)
4. Setze die Environment Variables für den Socket.io Service:
   ```bash
   NODE_ENV=production
   PORT=3001
   ```
5. Kopiere die öffentliche Domain des Socket.io Services

### Option B: Monolith (Alles in einem Service)

1. Erstelle eine `start.sh` Datei im Root:
   ```bash
   #!/bin/bash
   # Starte Socket.io Server im Hintergrund
   cd server && node index.js &
   # Starte Next.js App
   cd .. && node server.js
   ```
2. Mache sie ausführbar: `chmod +x start.sh`
3. In Railway Settings → Start Command: `./start.sh`

## Schritt 4: Next.js App Konfiguration

1. Gehe zu den Settings des Next.js Service
2. **Build Command**: `npm run build`
3. **Start Command**: `node server.js` (wird automatisch aus Dockerfile verwendet)
4. **Watch Paths**: `/` (automatisch)

## Schritt 5: Domain & Networking

### Für Socket.io Service:
1. Gehe zu Service Settings → Networking
2. Klicke auf "Generate Domain"
3. Kopiere die Domain (z.B. `kopfrechnen-socket.up.railway.app`)
4. Setze diese im Next.js Service als Environment Variable:
   ```bash
   NEXT_PUBLIC_SOCKET_URL=https://kopfrechnen-socket.up.railway.app
   ```

### Für Next.js Service:
1. Gehe zu Service Settings → Networking
2. Klicke auf "Generate Domain"
3. Dies wird deine öffentliche URL (z.B. `kopfrechnen.up.railway.app`)

## Schritt 6: Custom Domain (Optional)

1. Gehe zu Service Settings → Domains
2. Klicke auf "Custom Domain"
3. Füge deine Domain hinzu (z.B. `kopfrechnen.deine-domain.de`)
4. Setze die DNS Records wie von Railway angezeigt:
   ```
   Type: CNAME
   Name: kopfrechnen (oder @)
   Value: [railway-provided-value]
   ```

## Schritt 7: Deploy!

Railway deployt automatisch bei jedem Push zu `main`. Oder manuell:

1. Klicke auf "Deploy Now" im Dashboard
2. Warte auf den Build (1-3 Minuten)
3. Check die Logs auf Fehler

## Troubleshooting

### Build schlägt fehl?
- Checke die Build Logs in Railway
- Stelle sicher, dass alle Environment Variables gesetzt sind
- Teste lokal mit `npm run build`

### Socket.io verbindet nicht?
- Stelle sicher, dass `NEXT_PUBLIC_SOCKET_URL` korrekt gesetzt ist
- Check ob der Socket.io Service läuft (grüner Status)
- Schaue in die Browser Console auf Fehler

### 502/503 Errors?
- Warte 1-2 Minuten nach dem Deploy
- Railway braucht Zeit zum Hochfahren
- Check die Service Logs auf Crashes

## Kosten

Railway ist **kostenlos** für:
- $5 monatliches Credit (reicht für kleine bis mittlere Apps)
- Automatisches Scaling
- SSL Zertifikate
- Custom Domains

Für mehr Traffic: **Developer Plan** ($5/Monat) gibt dir $10 Credit.

## Vorteile gegenüber Vercel

✅ **Full-Stack**: Next.js + Socket.io in einem Projekt
✅ **Zuverlässiger**: Weniger 503-Fehler
✅ **Einfacher**: Environment Variables & Deployment
✅ **Logging**: Bessere Logs und Monitoring
✅ **WebSockets**: Native Unterstützung ohne Edge-Function-Probleme

## Support

Railway Docs: https://docs.railway.app/
Railway Discord: https://discord.gg/railway

