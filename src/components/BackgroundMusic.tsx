'use client';

import { useState, useEffect, useRef } from 'react';

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
          toggle: () => void;
        };
        Events: {
          READY: string;
          PLAY: string;
          PAUSE: string;
        };
      };
    };
  }
}

export default function BackgroundMusic({ isPlaying }: BackgroundMusicProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<{
    play: () => void;
    pause: () => void;
    toggle: () => void;
    bind: (event: string, callback: () => void) => void;
  } | null>(null);

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

  useEffect(() => {
    if (isLoaded && iframeRef.current && window.SC) {
      const widget = window.SC.Widget(iframeRef.current);
      widgetRef.current = widget;

      widget.bind(window.SC.Widget.Events.READY, () => {
        console.log('SoundCloud widget ready');
        setIsWidgetReady(true);
      });

      // Add event listeners for play/pause to track state
      widget.bind(window.SC.Widget.Events.PLAY, () => {
        console.log('SoundCloud started playing');
        setHasUserInteracted(true);
      });

      widget.bind(window.SC.Widget.Events.PAUSE, () => {
        console.log('SoundCloud paused');
      });
    }
  }, [isLoaded]);

  useEffect(() => {
    if (widgetRef.current && isWidgetReady) {
      // Add a small delay to ensure widget is fully ready
      const timer = setTimeout(() => {
        if (isPlaying) {
          // On mobile devices, use a more aggressive approach for the first play
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          
          if (!hasUserInteracted && isMobile) {
            console.log('Mobile first play - using toggle()');
            setHasUserInteracted(true);
            
            // Try toggle first, if that fails, try play
            try {
              widgetRef.current!.toggle();
            } catch (error) {
              console.log('Toggle failed, trying play:', error);
              widgetRef.current!.play();
            }
          } else {
            console.log('Regular play');
            widgetRef.current!.play();
          }
        } else {
          console.log('Pausing');
          widgetRef.current!.pause();
        }
      }, 100); // Small delay to ensure widget is ready

      return () => clearTimeout(timer);
    }
  }, [isPlaying, isWidgetReady, hasUserInteracted]);

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
          allow="autoplay; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1901967227&color=%23664729&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true&buying=false&liking=false&download=false&sharing=false"
        />
      )}
    </div>
  );
}