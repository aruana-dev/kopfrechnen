# 🚀 Railway Quickstart - In 10 Minuten live!

## Option 1: Automatisches Deployment (EMPFOHLEN)

### Schritt 1: Railway Button
1. Gehe zu https://railway.app/new
2. Klicke auf "Deploy from GitHub repo"
3. Wähle dein Repository: `aruana-dev/kopfrechnen`
4. Railway erkennt automatisch das Projekt!

### Schritt 2: Environment Variables setzen
Während des Deployments, füge hinzu:

```bash
NEXT_PUBLIC_JSONBIN_API_KEY=<dein-api-key>
NEXT_PUBLIC_INDEX_BIN_ID=<deine-bin-id>
NODE_ENV=production
```

### Schritt 3: Fertig! ✅
Railway deployt automatisch. Nach 2-3 Minuten ist deine App live!

---

## Option 2: Separater Socket.io Server (Für hohe Last)

### Schritt 1: Erstelle 2 Services

#### Service 1: Next.js App
1. Neues Projekt → GitHub Repo
2. **Root Directory**: `/`
3. **Build Command**: `npm run build`
4. **Start Command**: `npm run start:railway`
5. Environment Variables:
   ```bash
   NEXT_PUBLIC_JSONBIN_API_KEY=<dein-key>
   NEXT_PUBLIC_INDEX_BIN_ID=<deine-id>
   NEXT_PUBLIC_SOCKET_URL=https://<socket-service>.railway.app
   NODE_ENV=production
   ```

#### Service 2: Socket.io Server
1. Im selben Projekt → "+ New" → "GitHub Repo"
2. **Root Directory**: `server`
3. **Start Command**: `npm start`
4. Environment Variables:
   ```bash
   NODE_ENV=production
   PORT=3001
   ```
5. Kopiere die generierte Domain und setze sie als `NEXT_PUBLIC_SOCKET_URL` in Service 1

### Schritt 2: Domains generieren
- Next.js Service → Settings → Networking → "Generate Domain"
- Socket.io Service → Settings → Networking → "Generate Domain"

### Schritt 3: Fertig! ✅

---

## Option 3: Monolith (Alles in einem Service)

### Schritt 1: Ein Service für alles
1. Neues Projekt → GitHub Repo
2. **Build Command**: `npm run build`
3. **Start Command**: `npm run start:monolith`
4. Environment Variables:
   ```bash
   NEXT_PUBLIC_JSONBIN_API_KEY=<dein-key>
   NEXT_PUBLIC_INDEX_BIN_ID=<deine-id>
   NEXT_PUBLIC_SOCKET_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   NODE_ENV=production
   ```

### Schritt 2: Fertig! ✅

---

## Nach dem Deployment

### Domain checken
- Gehe zu Service → Settings → Networking
- Kopiere die Railway Domain (z.B. `kopfrechnen.up.railway.app`)
- Teste in Browser!

### Logs checken
- Klicke auf den Service
- Gehe zu "Deployments"
- Klicke auf das neueste Deployment
- Checke "Build Logs" und "Deploy Logs"

### Monitoring
- Railway zeigt automatisch:
  - CPU Usage
  - Memory Usage
  - Network Traffic
  - Request Count

---

## Troubleshooting

### "Build Failed"?
```bash
# Checke ob der Build lokal funktioniert:
npm install
npm run build
```

### "Application Error"?
```bash
# Checke die Deploy Logs in Railway
# Meist fehlen Environment Variables
```

### Socket.io verbindet nicht?
```bash
# 1. Checke NEXT_PUBLIC_SOCKET_URL in Environment Variables
# 2. Stelle sicher, dass Socket.io Service läuft (grüner Status)
# 3. Öffne Browser Console und schaue nach Socket.io Fehlern
```

### 502 Bad Gateway?
```bash
# Railway braucht 1-2 Minuten zum Hochfahren
# Warte kurz und versuche es nochmal
```

---

## Custom Domain hinzufügen

1. Gehe zu Service → Settings → Domains
2. Klicke auf "Custom Domain"
3. Füge deine Domain hinzu (z.B. `kopfrechnen.schule.de`)
4. Setze DNS Records bei deinem Domain-Provider:
   ```
   Type: CNAME
   Name: kopfrechnen (oder @)
   Value: <railway-generated-value>
   ```
5. Warte 5-60 Minuten für DNS-Propagierung
6. Fertig! ✅ SSL wird automatisch erstellt

---

## Kosten

- **Hobby Plan**: $5 Credit/Monat (kostenlos)
  - Reicht für ca. 500-1000 aktive Sessions/Monat
  
- **Developer Plan**: $5/Monat → $10 Credit
  - Reicht für ca. 2000-5000 aktive Sessions/Monat

- **Pro Plan**: $20/Monat → $50 Credit
  - Für große Schulen mit vielen gleichzeitigen Nutzern

💡 Tipp: Starte mit Hobby Plan und upgrade nur wenn nötig!

---

## Support

- Railway Docs: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/aruana-dev/kopfrechnen/issues

**Viel Erfolg! 🚂🎉**

