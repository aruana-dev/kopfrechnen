# 🔐 Environment Variables für Railway

## Erforderliche Variables für Next.js Service

```bash
# JSONBin API Key (erforderlich)
NEXT_PUBLIC_JSONBIN_API_KEY=your_jsonbin_api_key_here

# JSONBin Index Bin ID (erforderlich)
NEXT_PUBLIC_INDEX_BIN_ID=your_index_bin_id_here

# Socket.io Server URL
# Option 1: Separater Socket.io Service
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app

# Option 2: Monolith (alles in einem)
NEXT_PUBLIC_SOCKET_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Node Environment
NODE_ENV=production

# Port (wird automatisch von Railway gesetzt)
PORT=3000
```

## Erforderliche Variables für Socket.io Service (wenn separat)

```bash
# Node Environment
NODE_ENV=production

# Port (wird automatisch von Railway gesetzt)
PORT=3001

# Optional: CORS Origins
ALLOWED_ORIGINS=${{NEXT_JS_SERVICE_DOMAIN}}
```

## Wo finde ich diese Werte?

### NEXT_PUBLIC_JSONBIN_API_KEY
1. Gehe zu https://jsonbin.io/
2. Logge dich ein
3. Navigiere zu "API Keys"
4. Kopiere deinen Master Key

### NEXT_PUBLIC_INDEX_BIN_ID
1. Das ist die ID deines Index-Bins in JSONBin
2. Zu finden in der URL: `https://jsonbin.io/app/bins/[DEINE_BIN_ID]`
3. Oder erstelle einen neuen mit dem Admin Tool: `/admin/setup-index`

### NEXT_PUBLIC_SOCKET_URL
- **Für separaten Socket.io Service**: 
  - Railway generiert eine Domain für jeden Service
  - Format: `https://your-project-name-socket.up.railway.app`
  
- **Für Monolith**: 
  - Verwende `${{RAILWAY_PUBLIC_DOMAIN}}`
  - Railway setzt dies automatisch auf die öffentliche Domain

## Wie setze ich die Variables in Railway?

1. Gehe zu deinem Railway Projekt
2. Klicke auf den Service (Next.js oder Socket.io)
3. Navigiere zu "Variables" Tab
4. Klicke auf "New Variable"
5. Füge Name und Value ein
6. Klicke auf "Add"

💡 **Tipp**: Railway deployt automatisch neu, sobald du Variables änderst!

## Unterschied zu Vercel

- Railway: Environment Variables werden zur **Build-Zeit UND Runtime** gesetzt
- Vercel: Nur zur **Build-Zeit** verfügbar für `NEXT_PUBLIC_*` Variables

Das bedeutet: Railway ist flexibler für Full-Stack Apps! 🚀

