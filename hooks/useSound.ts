import { useEffect, useRef, useState } from 'react';

interface SoundHook {
  playSound: (soundName: string) => void;
  playBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

export function useSound(enabled: boolean = true, role: 'teacher' | 'student' = 'teacher'): SoundHook {
  const [isMuted, setIsMuted] = useState(false);
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const backgroundMusic = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Cleanup bei Unmount
    return () => {
      audioCache.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioCache.current.clear();
      
      if (backgroundMusic.current) {
        backgroundMusic.current.pause();
        backgroundMusic.current.src = '';
        backgroundMusic.current = null;
      }
    };
  }, []);

  const playSound = async (soundName: string) => {
    if (!enabled || isMuted || role !== 'teacher') return;

    try {
      // Prüfe ob Sound existiert
      const response = await fetch(`/sounds/${soundName}`, { method: 'HEAD' });
      if (!response.ok) {
        console.log(`Sound nicht gefunden: ${soundName}`);
        return;
      }

      // Verwende gecachte Audio oder erstelle neue
      let audio = audioCache.current.get(soundName);
      if (!audio) {
        audio = new Audio(`/sounds/${soundName}`);
        audioCache.current.set(soundName, audio);
      }

      // Spiele Sound ab
      audio.currentTime = 0;
      await audio.play();
      console.log(`Sound abgespielt: ${soundName}`);
    } catch (error) {
      console.log(`Konnte Sound nicht abspielen: ${soundName}`, error);
    }
  };

  const playBackgroundMusic = async () => {
    if (!enabled || isMuted || role !== 'teacher') return;

    try {
      // Prüfe ob Sound existiert
      const response = await fetch('/sounds/background.mp3', { method: 'HEAD' });
      if (!response.ok) {
        console.log('Hintergrundmusik nicht gefunden');
        return;
      }

      if (!backgroundMusic.current) {
        backgroundMusic.current = new Audio('/sounds/background.mp3');
        backgroundMusic.current.loop = true;
        backgroundMusic.current.volume = 0.3; // Leiser als Effekte
      }

      await backgroundMusic.current.play();
      console.log('Hintergrundmusik gestartet');
    } catch (error) {
      console.log('Konnte Hintergrundmusik nicht abspielen', error);
    }
  };

  const stopBackgroundMusic = () => {
    if (backgroundMusic.current) {
      backgroundMusic.current.pause();
      backgroundMusic.current.currentTime = 0;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      stopBackgroundMusic();
    }
  };

  return { playSound, playBackgroundMusic, stopBackgroundMusic, isMuted, toggleMute };
}

