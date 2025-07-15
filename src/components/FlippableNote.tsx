"use client";

import { useRef, useImperativeHandle, forwardRef, useEffect, useState } from "react";
import SVGDrawingCanvas, { SVGDrawingCanvasRef } from "./SVGDrawingCanvas";
import TypingCanvas from "./TypingCanvas";
import NoiseFilter from "./NoiseFilter";

interface FlippableNoteProps {
  width?: number;
  height?: number;
  background: string;
  frontContent?: React.ReactNode;
  isEditable?: boolean;
  authorName?: string;
  onAuthorNameChange?: (drawingData: string) => void;
  style?: React.CSSProperties;
  className?: string;
  isFlipped?: boolean;
  onUndo?: () => void;
  // New props for typing mode
  isTypingMode?: boolean;
  typedText?: string;
  onTextChange?: (text: string) => void;
  // Props for conversation button
  showConversationButton?: boolean;
}

export interface FlippableNoteRef {
  handleUndo: () => void;
}

const FlippableNote = forwardRef<FlippableNoteRef, FlippableNoteProps>(
  (
    {
      width = 320,
      height = 320,
      background,
      frontContent,
      isEditable = false,
      authorName = "",
      onAuthorNameChange,
      style = {},
      className = "",
      isFlipped = false,
      onUndo,
      isTypingMode = false,
      typedText = "",
      onTextChange,
      showConversationButton = false,
    },
    ref
  ) => {
    const drawingCanvasRef = useRef<SVGDrawingCanvasRef>(null);
    const [supportsSvgFilters, setSupportsSvgFilters] = useState(true);

    useEffect(() => {
      // Simple mobile detection - if mobile, use CSS texture
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        setSupportsSvgFilters(false);
      } else {
        // Test if SVG filters are supported on desktop
        const testSvgFilters = () => {
          try {
            const testElement = document.createElement('div');
            testElement.style.filter = 'url(#note-noise)';
            testElement.style.position = 'absolute';
            testElement.style.top = '-9999px';
            testElement.style.width = '1px';
            testElement.style.height = '1px';
            document.body.appendChild(testElement);
            
            // Small delay to ensure styles are applied
            setTimeout(() => {
              const computedStyle = window.getComputedStyle(testElement);
              const supportsFilters = computedStyle.filter !== 'none';
              document.body.removeChild(testElement);
              setSupportsSvgFilters(supportsFilters);
            }, 100);
          } catch {
            setSupportsSvgFilters(false);
          }
        };
        
        testSvgFilters();
      }
    }, []);

    const handleUndo = () => {
      if (drawingCanvasRef.current) {
        drawingCanvasRef.current.undo();
      }
      if (onUndo) {
        onUndo();
      }
    };

    const handleStartConversation = async () => {
      const message =
        "hey i saw your answer on little notes and im really interested - want to chat?";

      if (navigator.share) {
        try {
          await navigator.share({
            title: "Little Notes",
            text: message,
          });
        } catch {
          // User cancelled, do nothing
        }
      } else {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(message);
          // Could show a toast notification here
        } catch {
          // Fallback failed, could show an alert
          alert(message);
        }
      }
    };

    // Expose handleUndo to parent via ref
    useImperativeHandle(ref, () => ({
      handleUndo,
    }));

    // CSS-based paper texture for mobile
    const createPaperTextureOverlay = () => {
      if (supportsSvgFilters) return null;
      
      return (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 30%, rgba(0,0,0,0.03) 1px, transparent 1px),
              radial-gradient(circle at 80% 70%, rgba(0,0,0,0.02) 1px, transparent 1px),
              radial-gradient(circle at 40% 80%, rgba(0,0,0,0.025) 1px, transparent 1px),
              radial-gradient(circle at 60% 20%, rgba(0,0,0,0.015) 1px, transparent 1px),
              radial-gradient(circle at 30% 60%, rgba(0,0,0,0.02) 1px, transparent 1px),
              radial-gradient(circle at 90% 40%, rgba(0,0,0,0.01) 1px, transparent 1px)
            `,
            backgroundSize: '15px 15px, 25px 25px, 20px 20px, 30px 30px, 18px 18px, 12px 12px',
            backgroundPosition: '0 0, 8px 8px, 4px 12px, 16px 4px, 12px 16px, 6px 10px',
            pointerEvents: 'none',
            borderRadius: 'inherit',
            mixBlendMode: 'multiply',
          }}
        />
      );
    };

    return (
      <>
        {supportsSvgFilters && <NoiseFilter />}
        <div
          className={`flippable-note-container ${className}`}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            perspective: "1000px",
            ...style,
          }}
        >
          <div
            className="flippable-note"
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              transformStyle: "preserve-3d",
              transition: "transform 0.6s",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              cursor: "pointer",
            }}
          >
            {/* Front Side */}
            <div
              className="note-front"
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                background,
                boxShadow: "var(--note-shadow)",
                border: "var(--note-border)",
                filter: supportsSvgFilters ? "var(--note-noise-filter)" : "none",
                padding: "40px",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {createPaperTextureOverlay()}
              {isTypingMode ? (
                <TypingCanvas
                  width={240}
                  height={240}
                  onTextChange={onTextChange}
                  initialText={typedText}
                  disabled={!isEditable}
                  placeholder="type here"
                />
              ) : (
                frontContent
              )}
            </div>

            {/* Back Side */}
            <div
              className="note-back"
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                background: background,
                boxShadow: "var(--note-shadow)",
                border: "var(--note-border)",
                filter: supportsSvgFilters ? "var(--note-noise-filter)" : "none",
                padding: "20px",
                boxSizing: "border-box",
                transform: "rotateY(180deg)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {createPaperTextureOverlay()}
              {/* From label */}
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "14px",
                  lineHeight: "18px",
                  fontWeight: "500",
                  color: "#7A7A7A", // Darker gray for better contrast
                  marginBottom: "10px",
                  textAlign: "center",
                }}
              >
                from:
              </div>

              {/* Drawing area for name */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 999,
                }}
              >
                {isEditable ? (
                  <SVGDrawingCanvas
                    ref={drawingCanvasRef}
                    width={280}
                    height={240}
                    onDrawingChange={onAuthorNameChange}
                    initialData={authorName}
                    showClearButton={false}
                  />
                ) : (
                  authorName && (
                    <div
                      style={{
                        width: "280px",
                        height: "240px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      dangerouslySetInnerHTML={{ __html: authorName }}
                    />
                  )
                )}
                {isEditable && !authorName && (
                  <div
                    style={{
                      position: "absolute",
                      color: "#7A7A7A",
                      fontSize: "16px",
                      fontFamily: "var(--font-handwritten)",
                      pointerEvents: "none",
                      textAlign: "center",
                    }}
                  >
                    draw your name
                  </div>
                )}
              </div>

              {/* Conversation button */}
              {showConversationButton && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    paddingTop: "10px",
                  }}
                >
                  <button
                    onClick={handleStartConversation}
                    style={{
                      background: "#FF5E01",
                      border: "none",
                      fontFamily: "var(--font-sans)",
                      fontWeight: "500",
                      fontSize: "14px",
                      lineHeight: "18px",
                      color: "white",
                      cursor: "pointer",
                      padding: "8px 10px",
                    }}
                  >
                    start a conversation &gt;
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
);

FlippableNote.displayName = "FlippableNote";

export default FlippableNote;
