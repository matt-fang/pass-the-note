'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface HeaderProps {
  showAbout?: boolean;
  onAboutChange?: (show: boolean) => void;
}

export default function Header({ showAbout = false, onAboutChange }: HeaderProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNewNote = () => {
    router.push('/');
  };

  const handleAbout = () => {
    if (onAboutChange) {
      onAboutChange(true);
    }
  };

  return (
    <>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        height: isMobile ? '90px' : '76px', // 26px + 24px logo + 26px
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '30px 0px' : '26px 26px',
        zIndex: 1000,
        background: 'transparent' // No background - just transparent
      }}>
        {/* Mobile: Plus button, Desktop: Logo */}
        {isMobile ? (
          <div style={{
            width: '100%',
            maxWidth: '320px', // Match note width
            margin: '0 auto',
            position: 'relative'
          }}>
            <button
              onClick={handleNewNote}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                left: '0'
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/plus.svg" 
                alt="New Note" 
                style={{
                  width: '14px',
                  height: '14px'
                }}
              />
            </button>
            
            {/* Centered logo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/littlenoteslogo.png" 
              alt="Little Notes" 
              style={{
                height: '24px',
                width: 'auto',
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            />
            
            {/* Info button aligned to right */}
            <button
              onClick={handleAbout}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                right: '0'
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/info.svg" 
                alt="About" 
                style={{
                  height: '14px',
                  width: 'auto' // Maintain aspect ratio
                }}
              />
            </button>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img 
            src="/littlenoteslogo.png" 
            alt="Little Notes" 
            style={{
              height: '24px',
              width: 'auto'
            }}
          />
        )}

        {/* Desktop: Navigation */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '4px'
          }}>
            <button
              onClick={handleNewNote}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontWeight: '500',
                fontSize: '14px',
                lineHeight: '18px',
                color: 'var(--text-dark)',
                padding: '0'
              }}
            >
              new note &gt;
            </button>
            <button
              onClick={handleAbout}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontWeight: '500',
                fontSize: '14px',
                lineHeight: '18px',
                color: 'var(--text-dark)',
                padding: '0'
              }}
            >
              about &gt;
            </button>
          </div>
        )}
      </div>

      {/* Progressive blur gradient below toolbar */}
      <div style={{
        position: 'absolute',
        top: isMobile ? '90px' : '76px',
        left: '0',
        right: '0',
        height: '40px',
        background: 'linear-gradient(to bottom, rgba(236, 232, 230, 0.8), transparent)',
        zIndex: 999
      }} />

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