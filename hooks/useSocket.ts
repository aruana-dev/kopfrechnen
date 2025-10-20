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
      // Socket URL: Intelligente Auto-Detection
      let socketUrl: string;
      
      if (typeof window !== 'undefined') {
        // Production: Verwende aktuelle Domain (Railway, Vercel, etc.)
        // Development: Verwende localhost:3001
        const isProduction = window.location.hostname !== 'localhost';
        
        if (isProduction) {
          // Auf Production: Verwende dieselbe Domain (Monolith-Modus)
          socketUrl = window.location.origin;
          console.log('🚀 Production-Modus: Verwende aktuelle Domain für Socket.io');
        } else {
          // Auf localhost: Verwende separaten Socket.io Server
          socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
          console.log('🔧 Development-Modus: Verwende lokalen Socket.io Server');
        }
      } else {
        socketUrl = 'http://localhost:3001';
      }
      
      console.log('🔌 Verbinde zu Socket.io Server:', socketUrl);
      
      globalSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });

      globalSocket.on('connect', () => {
        console.log('✅ Socket verbunden:', globalSocket?.id);
        setConnected(true);
      });

      globalSocket.on('disconnect', (reason) => {
        console.log('❌ Socket getrennt:', reason);
        setConnected(false);
      });

      globalSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket wieder verbunden nach', attemptNumber, 'Versuchen');
      });

      globalSocket.on('reconnect_error', (error) => {
        console.error('❌ Reconnect Fehler:', error);
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

