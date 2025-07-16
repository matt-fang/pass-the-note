"use client";

import { useState, useRef, useEffect } from "react";

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
  initialText = "",
  disabled = false,
  placeholder = "type here",
  textColor = "var(--text-dark)",
}: TypingCanvasProps) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;

    // Check if adding this text would overflow the visible area
    const textarea = e.target;
    const originalText = textarea.value;
    textarea.value = newText;

    // If text overflows (scrollHeight > clientHeight), revert to previous text
    if (textarea.scrollHeight > textarea.clientHeight) {
      textarea.value = originalText;
      return; // Don't update state if it would overflow
    }

    // Otherwise, update the text
    setText(newText);
    if (onTextChange) {
      onTextChange(newText);
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
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        cursor: disabled ? "default" : "text",
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
        style={
          {
            width: "100%",
            height: "100%",
            border: "none",
            background: "transparent",
            resize: "none",
            outline: "none",
            textAlign: "left",
            verticalAlign: "top",
            fontFamily: "var(--font-sans)",
            fontSize: "16px", // Body font size (same as "passed this note to you")
            lineHeight: "22px", // Body line height
            fontWeight: "500",
            color: textColor,
            padding: "0", // Remove all padding
            overflow: "hidden", // No scrolling
            // Make placeholder lighter
            "::placeholder": {
              color: "var(--text-light)",
              opacity: 0.6,
            },
          } as React.CSSProperties
        }
      />
    </div>
  );
}
