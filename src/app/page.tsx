'use client';

import { useState, useEffect } from 'react';

const NOTE_COLORS = [
  { bg: 'var(--note-green)', secondary: 'var(--note-green-secondary)' },
  { bg: 'var(--note-blue)', secondary: 'var(--note-blue-secondary)' },
  { bg: 'var(--note-beige)', secondary: 'var(--note-beige-secondary)' }
];

export default function Home() {
  const [shareUrl, setShareUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);
  const [textOffset, setTextOffset] = useState({ x: 0, y: 0 });
  const [questionOpacity, setQuestionOpacity] = useState(1);

  // Load question immediately when component mounts
  useEffect(() => {
    createNewNote();
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
    setQuestionOpacity(0);
    
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
        setTimeout(() => setQuestionOpacity(1), 50);
      }
    } catch (error) {
      console.error('Error getting new question:', error);
      setQuestionOpacity(1); // Reset opacity on error
    }
  };

  const shareNatively = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Little Notes',
          text: 'I sent you a little note ✨',
          url: shareUrl,
        });
      } catch {
        // User cancelled, do nothing
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--cream)',
      padding: '0 20px'
    }}>
      {/* Logo */}
      <div style={{
        position: 'absolute',
        top: '60px',
        left: '50%',
        transform: 'translateX(-50%)'
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/littlenoteslogo.png" 
          alt="Little Notes" 
          style={{
            height: '24px',
            width: 'auto'
          }}
        />
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px'
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
          {/* Note - Perfect Square, slightly bigger */}
          <div style={{
            width: '320px',
            height: '320px',
            background: noteColor.bg,
            boxShadow: 'var(--note-shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              fontFamily: 'var(--font-handwritten)',
              fontSize: '18px',
              lineHeight: '1.4',
              color: 'var(--text-dark)',
              textAlign: 'center',
              width: '100%',
              transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
              opacity: questionOpacity,
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/shuffle.svg" 
                alt="Shuffle"
                style={{
                  width: '16px',
                  height: '16px',
                  filter: `brightness(0) saturate(100%) invert(49%) sepia(8%) saturate(1128%) hue-rotate(75deg) brightness(95%) contrast(87%)`
                }}
              />
            </button>
          )}
        </div>

        {/* Share button */}
        <button
          onClick={shareNatively}
          disabled={!shareUrl}
          style={{
            background: 'none',
            border: 'none',
            fontFamily: 'var(--font-sans)',
            fontWeight: '500',
            fontSize: '16px',
            color: 'var(--text-dark)',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            cursor: 'pointer',
            padding: '12px',
            opacity: !shareUrl ? 0.5 : 1
          }}
        >
          share with a friend
        </button>
      </div>
    </div>
  );
}