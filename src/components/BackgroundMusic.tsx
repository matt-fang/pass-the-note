'use client';

import { useState, useEffect } from 'react';

interface BackgroundMusicProps {
  isPlaying: boolean;
  onToggle: () => void;
}

// Extend Window interface to include SC property
declare global {
  interface Window {
    SC?: unknown;
  }
}

export default function BackgroundMusic({ isPlaying }: BackgroundMusicProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load the SoundCloud widget API
    if (!window.SC) {
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

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
          width="100%"
          height="166"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1901967227&color=%23664729&auto_play=${isPlaying}&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
        />
      )}
    </div>
  );
}