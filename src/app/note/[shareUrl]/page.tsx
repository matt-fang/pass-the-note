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
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);
  const [textOffset, setTextOffset] = useState({ x: 0, y: 0 });
  const [responseNoteOffset, setResponseNoteOffset] = useState({ x: 0, y: 0, rotation: 0, color: NOTE_COLORS[0] });
  const [existingResponseOffsets, setExistingResponseOffsets] = useState<Array<{x: number, y: number, rotation: number, color: typeof NOTE_COLORS[0]}>>([]);

  useEffect(() => {
    if (shareUrl) {
      loadThread();
      // Set random note color
      const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
      setNoteColor(randomColor);
      
      // Set random text offset
      setTextOffset({
        x: (Math.random() - 0.5) * 6, // -3px to 3px
        y: (Math.random() - 0.5) * 4  // -2px to 2px
      });
      
      // Set random response note positioning
      setResponseNoteOffset({
        x: (Math.random() - 0.5) * 40, // -20px to 20px
        y: Math.random() * 6 - 6, // -6px to 0px (touching to slight overlap)
        rotation: (Math.random() - 0.5) * 8, // -4deg to 4deg
        color: NOTE_COLORS[(Math.floor(Math.random() * NOTE_COLORS.length) + 1) % NOTE_COLORS.length]
      });
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
  
  useEffect(() => {
    // Generate random offsets for existing responses when thread loads
    if (thread && thread.responses.length > 0) {
      const offsets = thread.responses.map((_, index) => ({
        x: (Math.random() - 0.5) * 40, // -20px to 20px
        y: (Math.random() - 0.5) * 20, // -10px to 10px
        rotation: (Math.random() - 0.5) * 8, // -4deg to 4deg
        color: NOTE_COLORS[index % NOTE_COLORS.length]
      }));
      setExistingResponseOffsets(offsets);
    }
  }, [thread]);

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
          text: 'i sent you a little note.',
          url: url,
        });
      } catch {
        // User cancelled, do nothing
      }
    }
  };

  if (isLoading) {
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
        <div style={{
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-dark)'
        }}>
          loading...
        </div>
      </div>
    );
  }

  if (!thread) {
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
          <div style={{
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
            fontWeight: '500',
            fontSize: '16px',
            lineHeight: '22px',
            color: 'var(--text-dark)'
          }}>
            note not found.
          </div>

          <div style={{
            width: '320px',
            height: '320px',
            background: 'var(--note-beige)',
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
              This note link is invalid or has expired.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: thread.responses.length > 0 ? 'flex-start' : 'center',
      background: 'var(--cream)',
      padding: '0 20px',
      paddingTop: thread.responses.length > 0 ? '140px' : '0',
      paddingBottom: thread.responses.length > 0 ? '60px' : '0'
    }}>
      {/* Logo */}
      <div style={{
        position: thread.responses.length > 0 ? 'fixed' : 'absolute',
        top: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000
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
        {canEdit && !newShareUrl && (
          <div style={{
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
            fontWeight: '500',
            fontSize: '16px',
            lineHeight: '22px',
            color: 'var(--text-dark)'
          }}>
            your friend passed you this note.<br />
            write your answer below.
          </div>
        )}

        {newShareUrl && (
          <div style={{
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
            fontWeight: '500',
            fontSize: '16px',
            lineHeight: '22px',
            color: 'var(--text-dark)'
          }}>
            your note has been added to the chain!
          </div>
        )}

        {nextShareUrl && !canEdit && !newShareUrl && (
          <div style={{
            textAlign: 'center',
            fontFamily: 'var(--font-sans)',
            fontWeight: '500',
            fontSize: '16px',
            lineHeight: '22px',
            color: 'var(--text-dark)'
          }}>
            this note has been responded to!<br />
            but you can still continue the chain.
          </div>
        )}

        {/* Note Container */}
        <div style={{ position: 'relative' }}>
          {/* Main Question Note */}
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
              transform: `translate(${textOffset.x}px, ${textOffset.y}px)`
            }}>
              {thread.question}
            </div>
          </div>

          {/* Response Note - positioned below with overlap and random positioning */}
          {canEdit && !newShareUrl && (
            <div style={{
              position: 'absolute',
              top: `${314 + responseNoteOffset.y}px`, // Touch or slight overlap (-6px to 0px)
              left: `${responseNoteOffset.x}px`, // Random horizontal offset
              width: '320px',
              height: '320px',
              background: responseNoteOffset.color.bg,
              boxShadow: 'var(--note-shadow)',
              padding: '40px',
              boxSizing: 'border-box',
              transform: `rotate(${responseNoteOffset.rotation}deg)` // Random rotation
            }}>
              {/* Full note drawing area */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DrawingCanvas
                  width={320}
                  height={320}
                  onDrawingChange={setDrawingData}
                  showClearButton={false}
                />
                {!drawingData && (
                  <div style={{
                    position: 'absolute',
                    color: responseNoteOffset.color.secondary,
                    fontSize: '18px',
                    fontFamily: 'var(--font-handwritten)',
                    pointerEvents: 'none',
                    textAlign: 'center'
                  }}>
                    WRITE HERE!
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Existing Response Notes - stacked below */}
          {thread.responses.length > 0 && thread.responses.map((response, index) => {
            if (!response.drawingData) return null;
            
            const offset = existingResponseOffsets[index] || { x: 0, y: 0, rotation: 0, color: NOTE_COLORS[0] };
            const stackOffset = index * 40; // Stack them closer vertically
            
            return (
              <div 
                key={response.id}
                style={{
                  position: 'absolute',
                  top: `${320 + stackOffset + offset.y}px`, // Below the main note + stack offset
                  left: `${offset.x}px`, // Random horizontal offset
                  width: '320px',
                  background: offset.color.bg,
                  boxShadow: 'var(--note-shadow)',
                  padding: '40px',
                  boxSizing: 'border-box',
                  transform: `rotate(${offset.rotation}deg)`, // Random rotation
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-handwritten)',
                  fontSize: '16px',
                  color: 'var(--text-dark)',
                  textAlign: 'center'
                }}>
                  {response.authorName || 'Anonymous'}
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <DrawingCanvas
                    width={240}
                    height={140}
                    initialData={response.drawingData}
                    disabled={true}
                    showClearButton={false}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Share/Submit button - positioned like sender screen */}
        {canEdit && !newShareUrl && drawingData && (
          <button
            onClick={submitResponse}
            disabled={isSubmitting}
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
              opacity: isSubmitting ? 0.5 : 1,
              marginTop: thread.responses.length > 0 ? '60px' : '40px'
            }}
          >
            {isSubmitting ? 'sending your note...' : 'share this question to a friend'}
          </button>
        )}

        {newShareUrl && (
          <button
            onClick={() => shareNatively(newShareUrl)}
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
              padding: '12px'
            }}
          >
            share this question to a friend
          </button>
        )}

        {nextShareUrl && !canEdit && !newShareUrl && (
          <button
            onClick={() => shareNatively(`${window.location.origin}/note/${nextShareUrl}`)}
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
              padding: '12px'
            }}
          >
            share this question to a friend
          </button>
        )}
      </div>
    </div>
  );
}