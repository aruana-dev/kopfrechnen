# 🚀 Deployment auf Vercel

## Wichtiger Hinweis: Socket.io Server

**Socket.io funktioniert nicht auf Vercel's serverless Functions!**

Sie haben 2 Optionen:

### Option 1: Nur Konto-Modus deployen (Empfohlen für Vercel)
- ✅ Lehrer-Accounts
- ✅ Klassen-Verwaltung
- ✅ Schüler-Dashboard
- ✅ Solo-Lern-Modus
- ❌ Live-Multiplayer-Sessions (brauchen Socket.io)

### Option 2: Separaten Socket.io Server (z.B. Railway.app)
- Deploy `server.ts` separat auf Railway.app oder Render.com
- Ändere Socket.io URL in `hooks/useSocket.ts`

## Deployment auf Vercel

### 1. Vercel CLI installieren (falls noch nicht)
```bash
npm i -g vercel
```

### 2. Environment Variables setzen

In Vercel Dashboard oder via CLI:
```bash
vercel env add NEXT_PUBLIC_JSONBIN_API_KEY
```

Wert eingeben (mit Backslashes):
```
\$2a\$10\$96Tg984PD3qwugh76N1vxe3XlWEIekFUhwcJe42HjvXMvcJtwO.Aq
```

### 3. Deployen
```bash
# Preview Deployment
vercel

# Production Deployment
vercel --prod
```

## Nach dem Deployment

### Vercel Dashboard:
1. Gehe zu **Settings** → **Environment Variables**
2. Füge hinzu:
   - Key: `NEXT_PUBLIC_JSONBIN_API_KEY`
   - Value: Dein JSONBin.io Master Key (mit \$ escaped)
3. **Redeploy** auslösen

### Features die funktionieren:
- ✅ Lehrer Login/Registrierung
- ✅ Klassen-Verwaltung
- ✅ Schüler-Codes & PDF-Export
- ✅ Schüler-Login mit Code
- ✅ Solo-Lern-Modus
- ✅ Fortschritt-Tracking
- ✅ Alle JSONBin.io Features

### Features die NICHT funktionieren (brauchen Socket.io):
- ❌ Live-Multiplayer-Sessions
- ❌ Echtzeit-Teilnehmer-Anzeige
- ❌ Live-Countdown
- ❌ Live-Rangliste

## Alternative: Socket.io auf Railway.app

Falls Sie Live-Sessions brauchen:

1. **Railway.app Account** erstellen
2. **Neues Projekt** → "Deploy from GitHub"
3. **server.ts** als eigenständigen Service deployen
4. **Railway URL** kopieren (z.B. `https://your-app.up.railway.app`)
5. **In hooks/useSocket.ts** URL ändern:
   ```typescript
   const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
   ```
6. **Environment Variable** in Vercel setzen:
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-app.up.railway.app
   ```

## Empfehlung

Für Schulen empfehle ich **Option 1**:
- Deployen Sie nur den **Konto-Modus** auf Vercel
- Schüler können **Solo üben** (funktioniert perfekt!)
- Für Live-Sessions: **Lokal hosten** (z.B. auf Schul-Server)
- Oder nutzen Sie Railway.app für Socket.io

## Weitere Infos

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app

