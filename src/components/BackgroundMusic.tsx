"use client";

import { useState, useEffect, useRef } from "react";

interface BackgroundMusicProps {
  isPlaying: boolean;
  onToggle: () => void;
  shouldShuffle?: boolean;
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
          setVolume: (volume: number) => void;
          getVolume: (callback: (volume: number) => void) => void;
          skip: (soundIndex: number) => void;
          getSounds: (callback: (sounds: unknown[]) => void) => void;
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

export default function BackgroundMusic({ isPlaying, shouldShuffle = false }: BackgroundMusicProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [hasSecretlyPrimed, setHasSecretlyPrimed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<{
    play: () => void;
    pause: () => void;
    toggle: () => void;
    setVolume: (volume: number) => void;
    getVolume: (callback: (volume: number) => void) => void;
    bind: (event: string, callback: () => void) => void;
    skip: (soundIndex: number) => void;
    getSounds: (callback: (sounds: unknown[]) => void) => void;
  } | null>(null);

  const shufflePlaylist = () => {
    if (widgetRef.current) {
      widgetRef.current.getSounds((sounds) => {
        if (sounds && sounds.length > 1) {
          const randomIndex = Math.floor(Math.random() * sounds.length);
          console.log(`Shuffling to track ${randomIndex + 1} of ${sounds.length}`);
          widgetRef.current!.skip(randomIndex);
        }
      });
    }
  };

  useEffect(() => {
    // Load the SoundCloud widget API
    if (!window.SC) {
      const script = document.createElement("script");
      script.src = "https://w.soundcloud.com/player/api.js";
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && iframeRef.current && window.SC && !hasSecretlyPrimed) {
      const widget = window.SC.Widget(iframeRef.current);
      widgetRef.current = widget;

      widget.bind(window.SC.Widget.Events.READY, () => {
        console.log("SoundCloud widget ready");
        // Check initial volume
        widget.getVolume((volume) => {
          console.log("Initial volume:", volume);
        });
        // Set volume to 70% when widget is ready to ensure it's audible
        widget.setVolume(70);
        setIsWidgetReady(true);

        // SECRET PRIMING: More aggressive priming for mobile
        setTimeout(() => {
          console.log("🤫 Secretly priming widget...");

          // First prime: play for a moment
          widget.play();
          setTimeout(() => {
            widget.pause();

            // Second prime: play again briefly to ensure it works
            setTimeout(() => {
              widget.play();
              setTimeout(() => {
                widget.pause();
                setHasSecretlyPrimed(true);
                console.log("🤫 Widget double-primed and ready!");
                
                // Shuffle playlist if requested
                if (shouldShuffle) {
                  setTimeout(() => {
                    shufflePlaylist();
                  }, 500);
                }
              }, 150); // Slightly longer to ensure audio context starts
            }, 100);
          }, 150);
        }, 800); // Longer wait for widget to be fully ready
      });

      // Add event listeners for play/pause to track state
      widget.bind(window.SC.Widget.Events.PLAY, () => {
        console.log("SoundCloud started playing");
        // Double-check volume when play starts
        widget.getVolume((volume) => {
          console.log("Current volume:", volume);
          if (volume < 50) {
            console.log("Volume too low, setting to 70");
            widget.setVolume(70);
          }
        });
      });

      widget.bind(window.SC.Widget.Events.PAUSE, () => {
        console.log("SoundCloud paused");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]); // hasSecretlyPrimed intentionally omitted to prevent race condition

  useEffect(() => {
    if (widgetRef.current && isWidgetReady && hasSecretlyPrimed) {
      // Add a small delay to ensure widget is fully ready
      const timer = setTimeout(() => {
        if (isPlaying) {
          // Now that widget is primed, use simple play/pause
          console.log("Widget is primed - using regular play");
          widgetRef.current!.setVolume(70);
          widgetRef.current!.play();
        } else {
          console.log("Pausing");
          widgetRef.current!.pause();
        }
      }, 100); // Slightly longer delay for better reliability

      return () => clearTimeout(timer);
    }
  }, [isPlaying, isWidgetReady, hasSecretlyPrimed]);

  return (
    <div
      style={{
        position: "fixed",
        top: "-1000px",
        left: "-1000px",
        width: "1px",
        height: "1px",
        opacity: 0,
        pointerEvents: "none",
      }}
    >
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
          src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1923384855&color=%23664729&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
        />
      )}
      s
    </div>
  );
}
