'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [shareUrl, setShareUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load question immediately when component mounts
  useEffect(() => {
    createNewNote();
  }, []);

  const createNewNote = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/thread', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuestion(data.question);
        const fullUrl = `${window.location.origin}/note/${data.shareUrl}`;
        setShareUrl(fullUrl);
      }
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNewQuestion = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/thread', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuestion(data.question);
        const fullUrl = `${window.location.origin}/note/${data.shareUrl}`;
        setShareUrl(fullUrl);
      }
    } catch (error) {
      console.error('Error getting new question:', error);
    } finally {
      setIsLoading(false);
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
        gap: '32px'
      }}>
        {/* Text above note */}
        <div style={{
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          fontWeight: '500',
          fontSize: '14px',
          lineHeight: '20px',
          color: 'var(--text-dark)'
        }}>
          pass a little note to a friend.<br />
          start a big conversation.
        </div>

        {/* Note - Perfect Square */}
        <div style={{
          width: '300px',
          height: '300px',
          background: 'var(--note-white)',
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
            width: '100%'
          }}>
            {isLoading ? 'getting your question...' : question}
          </div>
        </div>

        {/* Share button */}
        <button
          onClick={shareNatively}
          disabled={isLoading || !shareUrl}
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
            opacity: isLoading || !shareUrl ? 0.5 : 1
          }}
        >
          share with a friend
        </button>

        {/* Random button */}
        {question && !isLoading && (
          <button
            onClick={getNewQuestion}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-sans)',
              fontWeight: '500',
              fontSize: '12px',
              color: 'var(--text-light)',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              cursor: 'pointer',
              padding: '8px',
              opacity: 0.7
            }}
          >
            ⚀⚁
          </button>
        )}
      </div>
    </div>
  );
}