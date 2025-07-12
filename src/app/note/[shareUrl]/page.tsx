'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DrawingCanvas from '@/components/DrawingCanvas';

interface Response {
  id: string;
  drawingData: string;
  authorName: string;
  createdAt: string;
}

interface Thread {
  id: string;
  question: string;
  responses: Response[];
}

const NOTE_COLORS = ['note-blue', 'note-yellow', 'note-pink'];

export default function NotePage() {
  const params = useParams();
  const shareUrl = params.shareUrl as string;
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [drawingData, setDrawingData] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newShareUrl, setNewShareUrl] = useState('');
  const [nextShareUrl, setNextShareUrl] = useState('');
  const [noteColor, setNoteColor] = useState('note-blue');

  useEffect(() => {
    if (shareUrl) {
      loadThread();
      // Randomly select a note color
      const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
      setNoteColor(randomColor);
    }
  }, [shareUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadThread = async () => {
    try {
      const response = await fetch(`/api/share/${shareUrl}`);
      if (response.ok) {
        const data = await response.json();
        setThread(data.thread);
        setCanEdit(data.canEdit);
        setNextShareUrl(data.nextShareUrl || '');
      } else {
        console.error('Thread not found');
      }
    } catch (error) {
      console.error('Error loading thread:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitResponse = async () => {
    if (!drawingData || !thread) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: thread.id,
          drawingData,
          authorName: authorName || 'Anonymous'
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const fullUrl = `${window.location.origin}/note/${data.shareUrl}`;
        setNewShareUrl(fullUrl);
        setCanEdit(false);
        await loadThread();
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareNatively = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Little Notes',
          text: 'I sent you a little note ✨',
          url: url,
        });
      } catch (err) {
        // User cancelled or error occurred, fallback to copy
        copyToClipboard(url);
      }
    } else {
      // No native share support, fallback to copy
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      const button = document.querySelector('.copy-btn');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 1000);
      }
    } catch (err) {
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-sans">loading...</div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="container text-center">
          <div className="note-card p-8">
            <h1 className="font-sans-bold text-xl mb-4">Note Not Found</h1>
            <p className="font-sans">This note link is invalid or has expired.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container">
        {/* Logo */}
        <div className="text-center pt-16 pb-8 fade-in">
          <div className="logo">
            Little Notes<sup style={{fontSize: '0.6em', verticalAlign: 'super'}}>™</sup>
          </div>
        </div>

        {/* Instruction Text */}
        {canEdit && !newShareUrl && (
          <div className="text-center mb-8 fade-in">
            <p className="font-sans text-base leading-relaxed">
              your friend passed you this note.<br />
              write your answer below.
            </p>
          </div>
        )}

        {/* Note Card with Question and Drawing Area */}
        {canEdit && !newShareUrl ? (
          <div className="fade-in">
            <div className={`note-card ${noteColor} p-0 mb-8 overflow-hidden`}>
              {/* Question at top of note */}
              <div className="p-6 pb-4">
                <div className="font-handwritten text-lg" style={{lineHeight: '1.4'}}>
                  {thread.question}
                </div>
              </div>
              
              {/* Drawing Area */}
              <div className="px-6 pb-6">
                <div className="drawing-area p-4 relative">
                  <DrawingCanvas
                    width={340}
                    height={240}
                    onDrawingChange={setDrawingData}
                    showClearButton={false}
                  />
                  {!drawingData && (
                    <div 
                      className="absolute inset-0 pointer-events-none flex items-center justify-center"
                      style={{
                        color: 'var(--text-light)',
                        fontSize: '0.9rem',
                        fontFamily: 'var(--font-handwritten)'
                      }}
                    >
                      ANSWER HERE
                    </div>
                  )}
                </div>
              </div>

              {/* Name Input */}
              <div className="px-6 pb-6">
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="input-clean text-sm"
                  placeholder="your name (optional)"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    border: '1px solid rgba(42,42,42,0.1)',
                    width: '100%'
                  }}
                />
              </div>
            </div>

            {/* Submit Button - only show when there's drawing data */}
            {drawingData && (
              <div className="text-center mb-8 fade-in">
                <button
                  onClick={submitResponse}
                  disabled={isSubmitting}
                  className="btn-link text-lg"
                >
                  {isSubmitting ? 'sending your note...' : 'done? pass the note to another friend'}
                </button>
              </div>
            )}
          </div>
        ) : newShareUrl ? (
          // After submitting - show share options
          <div className="fade-in">
            <div className="text-center mb-8">
              <p className="font-sans text-base leading-relaxed mb-6">
                your note has been added to the chain!
              </p>
              
              <button
                onClick={() => shareNatively(newShareUrl)}
                className="btn-link text-lg mb-6"
              >
                pass the note to another friend
              </button>

              <div>
                <div className="text-sm mb-2 font-sans" style={{color: 'var(--text-light)'}}>
                  or copy the link:
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newShareUrl}
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
                    onClick={() => copyToClipboard(newShareUrl)}
                    className="copy-btn btn-link text-sm"
                  >
                    copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : nextShareUrl ? (
          // If someone already responded - show next link
          <div className="fade-in">
            <div className="text-center mb-8">
              <p className="font-sans text-base leading-relaxed mb-6">
                this note has been responded to!<br />
                but you can still continue the chain.
              </p>
              
              <button
                onClick={() => shareNatively(`${window.location.origin}/note/${nextShareUrl}`)}
                className="btn-link text-lg mb-6"
              >
                pass the note to another friend
              </button>

              <div>
                <div className="text-sm mb-2 font-sans" style={{color: 'var(--text-light)'}}>
                  or copy the link:
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={`${window.location.origin}/note/${nextShareUrl}`}
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
                    onClick={() => copyToClipboard(`${window.location.origin}/note/${nextShareUrl}`)}
                    className="copy-btn btn-link text-sm"
                  >
                    copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Default message if no next URL
          <div className="text-center fade-in">
            <div className="note-card p-8">
              <p className="font-sans">
                This note has already been responded to.<br />
                The chain continues elsewhere!
              </p>
            </div>
          </div>
        )}

        {/* Show Previous Responses if Any */}
        {thread.responses.length > 0 && (
          <div className="mt-12 fade-in">
            <div className="text-center mb-6">
              <p className="font-sans text-sm" style={{color: 'var(--text-light)'}}>
                previous responses in this chain:
              </p>
            </div>
            
            <div className="space-y-6">
              {thread.responses.map((response, index) => {
                const responseColor = NOTE_COLORS[index % NOTE_COLORS.length];
                return response.drawingData ? (
                  <div key={response.id} className={`note-card ${responseColor} p-6`}>
                    <div className="mb-4">
                      <div className="font-handwritten text-base mb-2">
                        {response.authorName || 'Anonymous'}
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <DrawingCanvas
                        width={300}
                        height={200}
                        initialData={response.drawingData}
                        disabled={true}
                        showClearButton={false}
                      />
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}