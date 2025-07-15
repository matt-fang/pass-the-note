'use client';

import { useState, useRef, useEffect } from 'react';

interface TypingCanvasProps {
  width?: number;
  height?: number;
  onTextChange?: (text: string) => void;
  initialText?: string;
  disabled?: boolean;
  placeholder?: string;
  textColor?: string;
}

export default function TypingCanvas({ 
  width = 240, 
  height = 240, 
  onTextChange,
  initialText = '',
  disabled = false,
  placeholder = 'type here',
  textColor = 'var(--text-dark)'
}: TypingCanvasProps) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    // Limit text length to prevent overflow
    if (newText.length <= 150) { // Adjust this limit as needed
      setText(newText);
      if (onTextChange) {
        onTextChange(newText);
      }
    }
  };

  const handleFocus = () => {
    // Focus handler - could be used for future features
  };

  const handleBlur = () => {
    // Blur handler - could be used for future features
  };

  const handleClick = () => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div 
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: disabled ? 'default' : 'text'
      }}
      onClick={handleClick}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          background: 'transparent',
          resize: 'none',
          outline: 'none',
          textAlign: 'left',
          verticalAlign: 'top',
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          lineHeight: '18px',
          fontWeight: '500',
          color: textColor,
          padding: '19px',
          overflow: 'hidden',
          // Make placeholder lighter
          '::placeholder': {
            color: 'var(--text-light)',
            opacity: 0.6
          }
        } as React.CSSProperties}
      />
      
      {/* Character count indicator when getting close to limit */}
      {text.length > 120 && (
        <div style={{
          position: 'absolute',
          bottom: '5px',
          right: '5px',
          fontSize: '10px',
          color: text.length > 140 ? '#ff0000' : 'var(--text-light)',
          fontFamily: 'var(--font-sans)'
        }}>
          {text.length}/150
        </div>
      )}
    </div>
  );
}