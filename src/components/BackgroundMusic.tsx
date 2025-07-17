'use client';

import { useEffect, useRef, useState } from 'react';

interface BackgroundMusicProps {
  isPlaying: boolean;
  onToggle: () => void;
}

// Extend Window interface to include SC property
declare global {
  interface Window {
    SC?: {
      Widget: {
        (element: HTMLIFrameElement): {
          bind: (event: string, callback: () => void) => void;
          play: () => void;
          pause: () => void;
          setVolume: (volume: number) => void;
        };
        Events: {
          READY: string;
        };
      };
    };
  }
}

export default function BackgroundMusic({ isPlaying }: BackgroundMusicProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);

  // Load SoundCloud widget API
  useEffect(() => {
    if (!window.SC) {
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  // Initialize widget when loaded
  useEffect(() => {
    if (isLoaded && iframeRef.current && window.SC) {
      const widget = window.SC.Widget(iframeRef.current);
      widgetRef.current = widget;
      widget.bind(window.SC.Widget.Events.READY, () => {
        widget.setVolume(70);
        setIsWidgetReady(true);
      });
    }
  }, [isLoaded]);

  // One-time user gesture to unlock audio
  useEffect(() => {
    if (!isWidgetReady || isUnlocked) return;
    const unlock = () => {
      setIsUnlocked(true);
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('wheel', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('wheel', unlock);
    document.addEventListener('touchstart', unlock);
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('wheel', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, [isWidgetReady, isUnlocked]);

  // Respond to isPlaying changes after unlock
  useEffect(() => {
    if (!isWidgetReady || !isUnlocked || !widgetRef.current) return;
    if (isPlaying) {
      widgetRef.current.setVolume(70);
      widgetRef.current.play();
    } else {
      widgetRef.current.pause();
    }
  }, [isPlaying, isWidgetReady, isUnlocked]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '-1000px', 
      left: '-1000px',
      width: '1px',
      height: '1px',
      opacity: 0,
      pointerEvents: 'none'
    }}>
      {isLoaded && (
        <iframe
          ref={iframeRef}
          id="soundcloud-player"
          width="100%"
          height="166"
          scrolling="no"
          frameBorder="no"
          allow="autoplay; fullscreen; encrypted-media"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1901967227&color=%23664729&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true&buying=false&liking=false&download=false&sharing=false"
        />
      )}
    </div>
  );
}