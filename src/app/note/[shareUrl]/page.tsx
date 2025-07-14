'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DrawingCanvas from '@/components/DrawingCanvas';
import Header from '@/components/Header';

interface Response {
  id: string;
  drawingData: string;
  authorName: string;
  createdAt: string;
  positionX: number;
  positionY: number;
  rotation: number;
  noteColor: string;
  noteColorSecondary: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);
  const [textOffset, setTextOffset] = useState({ x: 0, y: 0 });
  const [responseNoteOffset, setResponseNoteOffset] = useState({ x: 0, y: 0, rotation: 0, color: NOTE_COLORS[0] });
  const [existingResponseOffsets, setExistingResponseOffsets] = useState<Array<{x: number, y: number, rotation: number, color: typeof NOTE_COLORS[0]}>>([]);
  const [showAbout, setShowAbout] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);
  const [notesSlideOut, setNotesSlideOut] = useState(false);
  const [showReadView, setShowReadView] = useState(false);

  useEffect(() => {
    if (params.shareUrl) {
      // Check if user has already responded to this note
      const hasRespondedKey = `responded_${params.shareUrl}`;
      const hasResponded = localStorage.getItem(hasRespondedKey) === 'true';
      
      if (hasResponded) {
        setShowReadView(true);
      }
      
      loadThread();
      // Set random note color
      const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
      setNoteColor(randomColor);
      
      // Set random text offset
      setTextOffset({
        x: (Math.random() - 0.5) * 6, // -3px to 3px
        y: (Math.random() - 0.5) * 4  // -2px to 2px
      });
      
      // Set random response note positioning - will be calculated after thread loads
      setResponseNoteOffset({
        x: (Math.random() - 0.5) * 40, // -20px to 20px
        y: 0, // Will be calculated based on existing responses
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
    // Use stored positioning data for existing responses
    if (thread && thread.responses.length > 0) {
      const offsets = thread.responses.map((response) => ({
        x: response.positionX,
        y: response.positionY,
        rotation: response.rotation,
        color: {
          bg: response.noteColor,
          secondary: response.noteColorSecondary,
          filter: 'none' // Not needed for stored responses
        }
      }));
      setExistingResponseOffsets(offsets);
      
      // Universal note positioning: 1-6px overlap for ALL notes
      if (thread.responses.length > 0) {
        // Find the note with the lowest (highest Y value) position
        const responsesWithPosition = thread.responses.filter(r => r.positionY !== undefined);
        
        if (responsesWithPosition.length > 0) {
          const lowestNote = responsesWithPosition.reduce((lowest, response) => {
            return response.positionY > lowest.positionY ? response : lowest;
          });
          
          // Position new note with 1-6px overlap below the lowest existing note
          const overlap = 1 + Math.random() * 5; // 1-6px overlap
          // Lowest note is at 314 + lowestNote.positionY, ends at 314 + lowestNote.positionY + 320
          // New note should start at that end position minus overlap
          const newStartY = (314 + lowestNote.positionY + 320) - overlap;
          // Since new note is positioned at 314 + responseNoteOffset.y, solve for responseNoteOffset.y
          const baseY = newStartY - 314;
          
          setResponseNoteOffset(prev => ({
            ...prev,
            y: baseY
          }));
        } else {
          // Fallback for older responses without position data - use simple stacking
          const overlap = 1 + Math.random() * 5; // 1-6px overlap
          setResponseNoteOffset(prev => ({
            ...prev,
            y: 6 - overlap // Main note ends at 320, positioned at 314 + y, so y = 320 - 314 - overlap = 6 - overlap
          }));
        }
      } else {
        // First response: 1-6px overlap with main note (which ends at 320px)
        const overlap = 1 + Math.random() * 5; // 1-6px overlap
        setResponseNoteOffset(prev => ({
          ...prev,
          y: 6 - overlap // Main note ends at 320, positioned at 314 + y, so y = 320 - 314 - overlap = 6 - overlap
        }));
      }
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
          authorName: 'Anonymous',
          positionX: responseNoteOffset.x,
          positionY: responseNoteOffset.y,
          rotation: responseNoteOffset.rotation,
          noteColor: responseNoteOffset.color.bg,
          noteColorSecondary: responseNoteOffset.color.secondary
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const fullUrl = `${window.location.origin}/note/${data.shareUrl}`;
        return fullUrl;
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
    return null;
  };

  const passNote = async () => {
    if (!drawingData || !thread) return;
    
    // 1. Submit the response and get share URL
    const shareUrl = await submitResponse();
    
    if (shareUrl) {
      // 2. Store that user has responded to THIS note
      const hasRespondedKey = `responded_${params.shareUrl}`;
      localStorage.setItem(hasRespondedKey, 'true');
      
      // 3. Open native sharing interface immediately
      await shareNatively(shareUrl);
      
      // 4. Trigger animation and passed state
      setNotesSlideOut(true);
      setTimeout(() => {
        setHasPassed(true);
        setCanEdit(false);
      }, 600); // Wait for slide animation to complete
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
        <Header showAbout={showAbout} onAboutChange={setShowAbout} />
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
        <Header showAbout={showAbout} onAboutChange={setShowAbout} />

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

  // If user has already responded, show read view
  if (showReadView && thread) {
    return (
      <div style={{
        minHeight: '100vh',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: 'var(--cream)',
        padding: '0 20px',
        paddingTop: '140px',
        paddingBottom: '120px'
      }}>
        <Header showAbout={showAbout} onAboutChange={setShowAbout} />

        {/* Read View Content */}
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
            you&apos;ve already responded to this note.<br />
            here&apos;s the conversation so far.
          </div>

          {/* Note Container - Read Only */}
          <div style={{ 
            position: 'relative',
            minHeight: `${Math.max(
              320,
              ...thread.responses.map(r => 314 + (r.positionY || 0) + 320)
            )}px`
          }}>
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

            {/* All Response Notes */}
            {thread.responses.length > 0 && thread.responses.map((response, index) => {
              if (!response.drawingData) return null;
              
              const offset = existingResponseOffsets[index] || { x: 0, y: 0, rotation: 0, color: NOTE_COLORS[0] };
              
              return (
                <div 
                  key={response.id}
                  style={{
                    position: 'absolute',
                    top: `${314 + offset.y}px`,
                    left: `${offset.x}px`,
                    width: '320px',
                    height: '320px',
                    background: offset.color.bg,
                    boxShadow: 'var(--note-shadow)',
                    padding: '40px',
                    boxSizing: 'border-box',
                    transform: `rotate(${offset.rotation}deg)`,
                    zIndex: 100 + index
                  }}
                >
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
                      initialData={response.drawingData}
                      disabled={true}
                      showClearButton={false}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: '#FF5E01',
              border: 'none',
              fontFamily: 'var(--font-sans)',
              fontWeight: '500',
              fontSize: '14px',
              lineHeight: '18px',
              color: 'white',
              cursor: 'pointer',
              padding: '8px 10px',
              marginTop: '40px'
            }}
          >
            write your own note &gt;
          </button>
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
      paddingBottom: thread.responses.length > 0 ? '120px' : '0'
    }}>
      <Header showAbout={showAbout} onAboutChange={setShowAbout} />

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px'
      }}>
        {/* Text above note */}
        {canEdit && (
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



        {/* Note Container */}
        <div style={{ 
          position: 'relative',
          minHeight: thread.responses.length > 0 ? 
            `${Math.max(
              320, // Minimum height for main note
              ...thread.responses.map(r => 314 + (r.positionY || 0) + 320), // Height needed for each stored response
              canEdit ? 314 + responseNoteOffset.y + 320 : 0 // Height needed for active drawing note
            )}px` :
            '320px',
          transform: notesSlideOut ? 'translateX(100vw)' : 'translateX(0)',
          transition: 'transform 0.6s ease-in-out'
        }}>
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
          {canEdit && (
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
              transform: `rotate(${responseNoteOffset.rotation}deg)`, // Random rotation
              zIndex: 200 // Higher z-index so it appears above existing notes
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
          
          {/* Existing Response Notes - positioned exactly as stored */}
          {thread.responses.length > 0 && thread.responses.map((response, index) => {
            if (!response.drawingData) return null;
            
            const offset = existingResponseOffsets[index] || { x: 0, y: 0, rotation: 0, color: NOTE_COLORS[0] };
            
            return (
              <div 
                key={response.id}
                style={{
                  position: 'absolute',
                  top: `${314 + offset.y}px`, // Use stored position directly without stack offset
                  left: `${offset.x}px`, // Use stored horizontal position
                  width: '320px',
                  height: '320px',
                  background: offset.color.bg,
                  boxShadow: 'var(--note-shadow)',
                  padding: '40px',
                  boxSizing: 'border-box',
                  transform: `rotate(${offset.rotation}deg)`, // Use stored rotation
                  zIndex: 100 + index // Lower z-index for existing notes
                }}
              >
                {/* Full note drawing area - exactly like active drawing note */}
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
                    initialData={response.drawingData}
                    disabled={true}
                    showClearButton={false}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Pass button - shows when user has drawn something */}
        {canEdit && !hasPassed && (
          <button
            onClick={passNote}
            disabled={isSubmitting || !drawingData}
            style={{
              background: isSubmitting || !drawingData ? '#E5E1DE' : '#FF5E01',
              border: 'none',
              fontFamily: 'var(--font-sans)',
              fontWeight: '500',
              fontSize: '14px',
              lineHeight: '18px',
              color: isSubmitting || !drawingData ? 'black' : 'white',
              cursor: isSubmitting || !drawingData ? 'default' : 'pointer',
              padding: '8px 10px',
              marginTop: '40px'
            }}
          >
            {isSubmitting ? 'sending your note...' : 'pass the note on >'}
          </button>
        )}

        {/* Passed state - shows after note is passed */}
        {hasPassed && (
          <div style={{
            textAlign: 'center',
            marginTop: '40px'
          }}>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: '500',
              fontSize: '24px',
              lineHeight: '30px',
              color: 'var(--text-dark)',
              marginBottom: '20px'
            }}>
              passed!
            </div>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                background: '#FF5E01',
                border: 'none',
                fontFamily: 'var(--font-sans)',
                fontWeight: '500',
                fontSize: '14px',
                lineHeight: '18px',
                color: 'white',
                cursor: 'pointer',
                padding: '8px 10px'
              }}
            >
              write your own note &gt;
            </button>
          </div>
        )}

      </div>
    </div>
  );
}