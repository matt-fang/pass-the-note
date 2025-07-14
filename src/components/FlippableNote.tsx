'use client';

import { useState } from 'react';
import DrawingCanvas from './DrawingCanvas';

interface FlippableNoteProps {
  width?: number;
  height?: number;
  background: string;
  frontContent: React.ReactNode;
  isEditable?: boolean;
  authorName?: string;
  onAuthorNameChange?: (drawingData: string) => void;
  style?: React.CSSProperties;
  className?: string;
}

export default function FlippableNote({
  width = 320,
  height = 320,
  background,
  frontContent,
  isEditable = false,
  authorName = '',
  onAuthorNameChange,
  style = {},
  className = ''
}: FlippableNoteProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className={`flippable-note-container ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        perspective: '1000px',
        ...style
      }}
      onClick={handleFlip}
    >
      <div
        className="flippable-note"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: 'pointer'
        }}
      >
        {/* Front Side */}
        <div
          className="note-front"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            background,
            boxShadow: 'var(--note-shadow)',
            padding: '40px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {frontContent}
        </div>

        {/* Back Side */}
        <div
          className="note-back"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            background: 'var(--light-gray)',
            boxShadow: 'var(--note-shadow)',
            padding: '20px',
            boxSizing: 'border-box',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* From label */}
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              lineHeight: '18px',
              color: '#7A7A7A', // Darker gray for better contrast
              marginBottom: '10px'
            }}
          >
            from:
          </div>

          {/* Drawing area for name */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent flip when interacting with drawing
          >
            {isEditable ? (
              <DrawingCanvas
                width={280}
                height={240}
                onDrawingChange={onAuthorNameChange}
                initialData={authorName}
                showClearButton={false}
              />
            ) : (
              authorName && (
                <DrawingCanvas
                  width={280}
                  height={240}
                  initialData={authorName}
                  disabled={true}
                  showClearButton={false}
                />
              )
            )}
            {isEditable && !authorName && (
              <div
                style={{
                  position: 'absolute',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '16px',
                  fontFamily: 'var(--font-handwritten)',
                  pointerEvents: 'none',
                  textAlign: 'center'
                }}
              >
                write your name
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}