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
  const [noteOffsets, setNoteOffsets] = useState<Array<{x: number, y: number, rotation: number, color: typeof NOTE_COLORS[0]}>>([]);

  useEffect(() => {
    if (shareUrl) {
      loadThread();
      // Set random note color for current note
      const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
      setNoteColor(randomColor);
    }
  }, [shareUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Generate random offsets and colors for existing notes when thread loads
    if (thread && thread.responses.length > 0) {
      const offsets = thread.responses.map(() => ({
        x: (Math.random() - 0.5) * 8, // -4px to 4px
        y: (Math.random() - 0.5) * 6, // -3px to 3px  
        rotation: (Math.random() - 0.5) * 4, // -2deg to 2deg
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
      }));
      setNoteOffsets(offsets);
    }
  }, [thread]);

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
          text: 'i sent you a little note.',
          url: url,
        });
      } catch {
        // User cancelled, do nothing
      }
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
    } catch {
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--cream)'
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--cream)',
        padding: '0 20px'
      }}>
        <div style={{
          width: '320px',
          height: '320px',
          background: 'var(--note-beige)',
          boxShadow: 'var(--note-shadow)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}>
          <div style={{
            fontFamily: 'var(--font-handwritten)',
            fontSize: '18px',
            lineHeight: '1.4',
            color: 'var(--text-dark)',
            marginBottom: '12px'
          }}>
            Note Not Found
          </div>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            color: 'var(--text-dark)'
          }}>
            This note link is invalid or has expired.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      overflow: 'auto',
      background: 'var(--cream)',
      padding: '0 20px'
    }}>
      {/* Logo */}
      <div style={{
        position: 'fixed',
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
        paddingTop: '140px',
        paddingBottom: '60px',
        gap: '40px'
      }}>
        {/* Instruction Text */}
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

        {canEdit && !newShareUrl ? (
          /* Question Note + Drawing Area */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '40px'
          }}>
            {/* Question Note */}
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
                width: '100%'
              }}>
                {thread.question}
              </div>
            </div>

            {/* Drawing Note */}
            <div style={{
              width: '320px',
              background: noteColor.bg,
              boxShadow: 'var(--note-shadow)',
              padding: '40px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Drawing Area */}
              <div style={{
                width: '100%',
                minHeight: '200px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '8px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DrawingCanvas
                  width={240}
                  height={180}
                  onDrawingChange={setDrawingData}
                  showClearButton={false}
                />
                {!drawingData && (
                  <div style={{
                    position: 'absolute',
                    color: 'var(--text-light)',
                    fontSize: '14px',
                    fontFamily: 'var(--font-handwritten)',
                    pointerEvents: 'none'
                  }}>
                    write your answer here
                  </div>
                )}
              </div>

              {/* Name Input */}
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="your name (optional)"
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(42,42,42,0.1)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  color: 'var(--text-dark)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Submit Button */}
            {drawingData && (
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
                  opacity: isSubmitting ? 0.5 : 1
                }}
              >
                {isSubmitting ? 'sending your note...' : 'share this question to a friend'}
              </button>
            )}
          </div>
        ) : newShareUrl ? (
          /* After Submitting */
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
              your note has been added to the chain!
            </div>
            
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

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                color: 'var(--text-light)'
              }}>
                or copy the link:
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  value={newShareUrl}
                  readOnly
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(42,42,42,0.1)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    color: 'var(--text-dark)',
                    width: '200px',
                    textAlign: 'center'
                  }}
                />
                <button
                  onClick={() => copyToClipboard(newShareUrl)}
                  className="copy-btn"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    color: 'var(--text-dark)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  copy
                </button>
              </div>
            </div>
          </div>
        ) : nextShareUrl ? (
          /* If Someone Already Responded */
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
              this note has been responded to!<br />
              but you can still continue the chain.
            </div>
            
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
          </div>
        ) : (
          /* Default Message */
          <div style={{
            width: '320px',
            height: '320px',
            background: 'var(--note-beige)',
            boxShadow: 'var(--note-shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            boxSizing: 'border-box',
            textAlign: 'center'
          }}>
            <div style={{
              fontFamily: 'var(--font-handwritten)',
              fontSize: '18px',
              lineHeight: '1.4',
              color: 'var(--text-dark)'
            }}>
              This note has already been responded to.<br />
              The chain continues elsewhere!
            </div>
          </div>
        )}

        {/* Stacked Previous Notes */}
        {thread.responses.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '60px',
            marginTop: '60px'
          }}>
            <div style={{
              textAlign: 'center',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              color: 'var(--text-light)'
            }}>
              previous responses in this chain:
            </div>
            
            <div style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '40px'
            }}>
              {thread.responses.map((response, index) => {
                if (!response.drawingData) return null;
                
                const offset = noteOffsets[index] || { x: 0, y: 0, rotation: 0, color: NOTE_COLORS[0] };
                
                return (
                  <div 
                    key={response.id}
                    style={{
                      width: '320px',
                      background: offset.color.bg,
                      boxShadow: 'var(--note-shadow)',
                      padding: '40px',
                      boxSizing: 'border-box',
                      transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.rotation}deg)`,
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
                        height={180}
                        initialData={response.drawingData}
                        disabled={true}
                        showClearButton={false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}