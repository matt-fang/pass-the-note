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
  const [newShareUrl, setNewShareUrl] = useState('');
  const [nextShareUrl, setNextShareUrl] = useState('');
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);
  const [textOffset, setTextOffset] = useState({ x: 0, y: 0 });
  const [responseNoteOffset, setResponseNoteOffset] = useState({ x: 0, y: 0, rotation: 0, color: NOTE_COLORS[0] });
  const [existingResponseOffsets, setExistingResponseOffsets] = useState<Array<{x: number, y: number, rotation: number, color: typeof NOTE_COLORS[0]}>>([]);
  const [showAbout, setShowAbout] = useState(false);

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
      
      // Calculate position for new response note below existing ones
      if (thread.responses.length > 0) {
        // Find the note with the lowest (highest Y value) position
        const responsesWithPosition = thread.responses.filter(r => r.positionY !== undefined);
        
        if (responsesWithPosition.length > 0) {
          const lowestNote = responsesWithPosition.reduce((lowest, response) => {
            return response.positionY > lowest.positionY ? response : lowest;
          });
          
          // Position new note below the lowest existing note with some random variation
          const baseY = lowestNote.positionY + 280 + (Math.random() * 20 - 10); // 280px below + random variation
          
          setResponseNoteOffset(prev => ({
            ...prev,
            y: baseY
          }));
        } else {
          // Fallback for older responses without position data
          const baseY = (thread.responses.length * 40) + (Math.random() * 6 - 6);
          setResponseNoteOffset(prev => ({
            ...prev,
            y: baseY
          }));
        }
      } else {
        // No existing responses, position normally below main note
        setResponseNoteOffset(prev => ({
          ...prev,
          y: Math.random() * 6 - 6 // -6px to 0px (touching to slight overlap)
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
        <div style={{ 
          position: 'relative',
          minHeight: thread.responses.length > 0 ? 
            `${Math.max(
              320, // Minimum height for main note
              ...thread.responses.map(r => 314 + (r.positionY || 0) + 320), // Height needed for each stored response
              canEdit ? 314 + responseNoteOffset.y + 320 : 0 // Height needed for active drawing note
            )}px` :
            '320px'
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
        {canEdit && !newShareUrl && (
          <button
            onClick={submitResponse}
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

        {newShareUrl && (
          <button
            onClick={() => shareNatively(newShareUrl)}
            style={{
              background: '#FF6B35',
              border: 'none',
              fontFamily: 'var(--font-sans)',
              fontWeight: '500',
              fontSize: '16px',
              color: 'white',
              cursor: 'pointer',
              padding: '12px 24px',
              borderRadius: '4px',
              marginTop: '40px'
            }}
          >
            pass the note on &gt;
          </button>
        )}

        {nextShareUrl && !canEdit && !newShareUrl && (
          <button
            onClick={() => shareNatively(`${window.location.origin}/note/${nextShareUrl}`)}
            style={{
              background: '#FF6B35',
              border: 'none',
              fontFamily: 'var(--font-sans)',
              fontWeight: '500',
              fontSize: '16px',
              color: 'white',
              cursor: 'pointer',
              padding: '12px 24px',
              borderRadius: '4px',
              marginTop: '40px'
            }}
          >
            pass the note on &gt;
          </button>
        )}
      </div>
    </div>
  );
}