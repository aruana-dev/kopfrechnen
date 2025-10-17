import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Globale Socket-Instanz, die nur einmal erstellt wird
let globalSocket: Socket | null = null;

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Verwende die globale Socket-Instanz oder erstelle eine neue
    if (!globalSocket) {
      // Socket URL: Aus Environment Variable oder localhost
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      
      console.log('🔌 Verbinde zu Socket.io Server:', socketUrl);
      
      globalSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
      });

      globalSocket.on('connect', () => {
        console.log('Socket verbunden:', globalSocket?.id);
        setConnected(true);
      });

      globalSocket.on('disconnect', () => {
        console.log('Socket getrennt');
        setConnected(false);
      });
    }

    socketRef.current = globalSocket;
    setConnected(globalSocket.connected);

    // Keine Socket-Schließung beim Unmount!
    return () => {
      // Socket bleibt offen
    };
  }, []);

  return { socket: socketRef.current, connected };
}

