'use client';

import { useState } from 'react';

export default function Home() {
  const [shareUrl, setShareUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Show a subtle feedback instead of alert
      const button = document.querySelector('.copy-btn');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 1000);
      }
    } catch (err) {
      // Fallback for older browsers
      alert('Link copied to clipboard!');
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
      } catch (err) {
        // User cancelled or error occurred, fallback to copy
        copyToClipboard();
      }
    } else {
      // No native share support, fallback to copy
      copyToClipboard();
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container">
        {/* Logo */}
        <div className="text-center pt-16 pb-12 fade-in">
          <div className="logo">
            Little Notes<sup style={{fontSize: '0.6em', verticalAlign: 'super'}}>™</sup>
          </div>
        </div>

        {!shareUrl ? (
          <div className="fade-in">
            {/* Tagline */}
            <div className="text-center mb-12">
              <p className="font-sans text-base leading-relaxed">
                pass a little note to a friend.<br />
                start a big conversation.
              </p>
            </div>

            {/* Note Card */}
            <div className="note-card p-8 mb-12 text-center">
              <div className="font-handwritten text-xl mb-6" style={{lineHeight: '1.4'}}>
                {question || 'Click below to get a question!'}
              </div>
              
              {question && (
                <button 
                  onClick={getNewQuestion}
                  disabled={isLoading}
                  className="btn-link text-sm"
                  aria-label="Get a new question"
                >
                  {isLoading ? '⟳' : '⚀⚁'} {isLoading ? 'getting new question...' : ''}
                </button>
              )}
            </div>

            {/* Create Button */}
            <div className="text-center">
              <button
                onClick={createNewNote}
                disabled={isLoading}
                className="btn-link text-lg"
              >
                {isLoading ? 'creating your note...' : question ? 'share with a friend' : 'get a question to share'}
              </button>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            {/* Note Preview */}
            <div className="note-card p-8 mb-8 text-center">
              <div className="font-handwritten text-xl mb-4" style={{lineHeight: '1.4'}}>
                {question}
              </div>
              <button 
                onClick={getNewQuestion}
                disabled={isLoading}
                className="btn-link text-sm"
                aria-label="Get a new question"
              >
                {isLoading ? '⟳' : '⚀⚁'} {isLoading ? 'getting new question...' : ''}
              </button>
            </div>

            {/* Share Section */}
            <div className="space-y-6">
              <div className="text-center">
                <button
                  onClick={shareNatively}
                  className="btn-link text-lg mb-4"
                >
                  share with a friend
                </button>
              </div>

              {/* Manual Copy Option */}
              <div className="text-center">
                <div className="text-sm mb-2 font-sans" style={{color: 'var(--text-light)'}}>
                  or copy the link:
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="input-clean text-sm flex-1 text-center"
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      border: '1px solid rgba(42,42,42,0.1)'
                    }}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="copy-btn btn-link text-sm"
                  >
                    copy
                  </button>
                </div>
              </div>

              {/* Start Over */}
              <div className="text-center pt-8">
                <button
                  onClick={() => {
                    setShareUrl('');
                    setQuestion('');
                  }}
                  className="btn-link text-sm"
                  style={{opacity: 0.6}}
                >
                  start over
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}