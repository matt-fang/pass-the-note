'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

const NOTE_COLORS = [
  { 
    bg: 'var(--note-green)', 
    secondary: 'var(--note-green-secondary)',
    filter: 'brightness(0) saturate(100%) invert(49%) sepia(8%) saturate(1128%) hue-rotate(75deg) brightness(95%) contrast(87%)'
  },
  { 
    bg: 'var(--note-blue)', 
    secondary: 'var(--note-blue-secondary)',
    filter: 'brightness(0) saturate(100%) invert(55%) sepia(18%) saturate(1045%) hue-rotate(166deg) brightness(95%) contrast(92%)'
  },
  { 
    bg: 'var(--note-beige)', 
    secondary: 'var(--note-beige-secondary)',
    filter: 'brightness(0) saturate(100%) invert(71%) sepia(12%) saturate(361%) hue-rotate(351deg) brightness(97%) contrast(91%)'
  }
];

export default function Home() {
  const [shareUrl, setShareUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);
  const [textOffset, setTextOffset] = useState({ x: 0, y: 0 });
  const [noteOpacity, setNoteOpacity] = useState(1);
  const [showAbout, setShowAbout] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Load question immediately when component mounts
  useEffect(() => {
    createNewNote();
  }, []);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const createNewNote = async () => {
    try {
      const response = await fetch('/api/thread', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuestion(data.question);
        const fullUrl = `${window.location.origin}/note/${data.shareUrl}`;
        setShareUrl(fullUrl);
        
        // Set random note color
        const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
        setNoteColor(randomColor);
        
        // Set random text offset
        setTextOffset({
          x: (Math.random() - 0.5) * 6, // -3px to 3px
          y: (Math.random() - 0.5) * 4  // -2px to 2px
        });
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const getNewQuestion = async () => {
    // Instant fade out
    setNoteOpacity(0);
    
    try {
      const response = await fetch('/api/thread', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update everything instantly
        setQuestion(data.question);
        const fullUrl = `${window.location.origin}/note/${data.shareUrl}`;
        setShareUrl(fullUrl);
        
        // Set random note color
        const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
        setNoteColor(randomColor);
        
        // Set random text offset
        setTextOffset({
          x: (Math.random() - 0.5) * 6, // -3px to 3px
          y: (Math.random() - 0.5) * 4  // -2px to 2px
        });
        
        // Fade back in
        setTimeout(() => setNoteOpacity(1), 50);
      }
    } catch (error) {
      console.error('Error getting new question:', error);
      setNoteOpacity(1); // Reset opacity on error
    }
  };

  const shareNatively = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Little Notes',
          text: 'i sent you a little note.',
          url: shareUrl,
        });
      } catch {
        // User cancelled, do nothing
      }
    }
  };


  const noteSize = 320; // Keep note size consistent across mobile and desktop
  const notePadding = 40;
  const fontSize = 18;

  return (
    <div style={{
      minHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--cream)',
      padding: '0 20px',
      position: 'relative'
    }}>
      <Header showAbout={showAbout} onAboutChange={setShowAbout} />

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: isMobile ? '15px' : '50px', // 50pt spacing between text and note
        paddingTop: isMobile ? '130px' : '116px' // Account for header + gradient (76px header + 40px gradient)
      }}>
        {/* Text above note */}
        <div style={{
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          fontWeight: '500',
          fontSize: '16px',
          lineHeight: '22px',
          color: 'var(--text-dark)'
        }}>
          pass a little note to a friend.<br />
          start a big conversation.
        </div>

        {/* Note Container - with shuffle button positioned on top */}
        <div style={{ position: 'relative' }}>
          {/* Note */}
          <div style={{
            width: `${noteSize}px`,
            height: `${noteSize}px`,
            background: noteColor.bg,
            boxShadow: 'var(--note-shadow)',
            opacity: noteOpacity,
            transition: 'opacity 0.2s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${notePadding}px`,
            boxSizing: 'border-box'
          }}>
            <div style={{
              fontFamily: 'var(--font-handwritten)',
              fontSize: `${fontSize}px`,
              lineHeight: '1.4',
              color: 'var(--text-dark)',
              textAlign: 'center',
              width: '100%',
              transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
              opacity: noteOpacity,
              transition: 'opacity 0.2s ease-in-out'
            }}>
              {question}
            </div>
          </div>

          {/* Shuffle button - positioned at bottom of note */}
          {question && (
            <button
              onClick={getNewQuestion}
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                fontWeight: '500',
                color: 'var(--text-dark)',
                opacity: noteOpacity,
                transition: 'opacity 0.2s ease-in-out'
              }}>
                shuffle
              </span>
            </button>
          )}
        </div>

        {/* Share button with 80pt spacing */}
        <div style={{ 
          marginTop: '80px' // 80pt spacing between note and button
        }}>
          <button
            onClick={shareNatively}
            disabled={!shareUrl}
            style={{
              background: !shareUrl ? '#E5E1DE' : '#FF5E01',
              border: 'none',
              fontFamily: 'var(--font-sans)',
              fontWeight: '500',
              fontSize: '14px',
              lineHeight: '18px',
              color: !shareUrl ? 'black' : 'white',
              cursor: !shareUrl ? 'default' : 'pointer',
              padding: '8px 10px'
            }}
          >
            share this note &gt;
          </button>
        </div>
      </div>

    </div>
  );
}