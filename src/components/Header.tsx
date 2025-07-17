'use client';

import { useState, useEffect } from 'react';
import BackgroundMusic from './BackgroundMusic';

interface HeaderProps {
  showAbout?: boolean;
  onAboutChange?: (show: boolean) => void;
}

export default function Header({ showAbout = false, onAboutChange }: HeaderProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMusic = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      {/* Background Music */}
      <BackgroundMusic isPlaying={isPlaying} onToggle={toggleMusic} />
      
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: '88px', // 32px + 24px logo + 32px
        display: 'flex',
        alignItems: 'center',
        justifyContent: isMobile ? 'center' : 'flex-start',
        padding: '32px',
        zIndex: 1000,
        background: 'transparent'
      }}>
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/littlenoteslogo.png" 
          alt="Little Notes" 
          onClick={() => window.location.href = '/'}
          style={{
            height: '24px',
            width: 'auto',
            cursor: 'pointer'
          }}
        />
        
        {/* Music toggle button - always on the right */}
        <button
          onClick={toggleMusic}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            right: '20px',
            width: '20px',
            height: '20px'
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={isPlaying ? "/music.note.svg" : "/music.note.slash.svg"}
            alt={isPlaying ? "Pause Music" : "Play Music"}
            style={{
              height: '16px',
              width: 'auto',
              filter: isPlaying ? 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(337deg) brightness(119%) contrast(119%)' : 'brightness(0) saturate(100%) invert(60%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(59%) contrast(100%)'
            }}
          />
        </button>
      </div>


      {/* About overlay */}
      {showAbout && onAboutChange && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'var(--cream)',
            padding: '40px',
            borderRadius: '8px',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: '500',
              fontSize: '18px',
              marginBottom: '20px',
              color: 'var(--text-dark)'
            }}>
              About Little Notes
            </h2>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              lineHeight: '20px',
              color: 'var(--text-dark)',
              marginBottom: '30px'
            }}>
              This is a placeholder for the about section. Add your content here.
            </p>
            <button
              onClick={() => onAboutChange(false)}
              style={{
                background: '#FF5E01',
                border: 'none',
                fontFamily: 'var(--font-sans)',
                fontWeight: '500',
                fontSize: '14px',
                lineHeight: '18px',
                color: 'white',
                cursor: 'pointer',
                padding: '8px 16px'
              }}
            >
              close
            </button>
          </div>
        </div>
      )}
    </>
  );
}