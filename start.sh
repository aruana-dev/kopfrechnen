#!/bin/bash
# Start Script für Railway Monolith Deployment
# Startet Socket.io Server und Next.js App zusammen

echo "🚂 Starte Railway Deployment..."

# Starte Socket.io Server im Hintergrund
echo "🔌 Starte Socket.io Server..."
cd server && node index.js &
SOCKET_PID=$!

# Warte kurz, damit Socket.io Server hochfährt
sleep 2

# Gehe zurück zum Root
cd ..

# Starte Next.js App
echo "⚡ Starte Next.js App..."
node server.js &
NEXT_PID=$!

# Warte auf beide Prozesse
wait $SOCKET_PID $NEXT_PID

