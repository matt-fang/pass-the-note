'use client';

import { useState, useRef, useEffect } from 'react';

interface TypingCanvasProps {
  width?: number;
  height?: number;
  onTextChange?: (text: string) => void;
  initialText?: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function TypingCanvas({ 
  width = 240, 
  height = 240, 
  onTextChange,
  initialText = '',
  disabled = false,
  placeholder = 'type here'
}: TypingCanvasProps) {
  const [text, setText] = useState(initialText);
  const [isFocused, setIsFocused] = useState(false);
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
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
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
          textAlign: 'center',
          fontFamily: 'var(--font-handwritten)',
          fontSize: '18px',
          lineHeight: '1.4',
          color: 'var(--text-dark)',
          padding: '20px',
          overflow: 'hidden',
          verticalAlign: 'middle',
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