"use client";

import { useRef, useImperativeHandle, forwardRef } from "react";
import SVGDrawingCanvas, { SVGDrawingCanvasRef } from "./SVGDrawingCanvas";
import TypingCanvas from "./TypingCanvas";

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
  // Note color for secondary color
  noteColor?: { bg: string; secondary: string; filter: string };
}

export interface FlippableNoteRef {
  handleUndo: () => void;
  handleClear: () => void;
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
      noteColor,
    },
    ref
  ) => {
    const drawingCanvasRef = useRef<SVGDrawingCanvasRef>(null);

    const handleUndo = () => {
      if (drawingCanvasRef.current) {
        drawingCanvasRef.current.undo();
      }
      if (onUndo) {
        onUndo();
      }
    };

    const handleClear = () => {
      if (drawingCanvasRef.current) {
        drawingCanvasRef.current.clear();
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

    // Expose handleUndo and handleClear to parent via ref
    useImperativeHandle(ref, () => ({
      handleUndo,
      handleClear,
    }));

    return (
      <>
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
                backgroundImage: `url(${background})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                transition: "background-image 0.3s ease-in-out",
                boxShadow: "var(--note-shadow)",
                padding: "19px",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isTypingMode ? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "0",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Text input area - height adjusted to leave space for signature */}
                  <div
                    style={{
                      flex: 1,
                      marginBottom: "19px",
                      boxSizing: "border-box",
                    }}
                  >
                    <TypingCanvas
                      onTextChange={onTextChange}
                      initialText={typedText}
                      disabled={!isEditable}
                      placeholder="trust that your friend can hold your honesty — answer here..."
                      textColor={noteColor?.secondary || "var(--text-dark)"}
                    />
                  </div>

                  {/* Signature space at bottom */}
                  <div
                    style={{
                      height: "34px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingBottom: "10px",
                      marginBottom: "11pt",
                    }}
                  >
                    {/* Signature will be added when note is flipped and signed */}
                  </div>
                </div>
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
                backgroundImage: `url(${background})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                boxShadow: "var(--note-shadow)",
                padding: "20px",
                boxSizing: "border-box",
                transform: "rotateY(180deg)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* From label */}
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "14px",
                  lineHeight: "18px",
                  fontWeight: "500",
                  color: "#BBC2BB",
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
                    height={200}
                    onDrawingChange={onAuthorNameChange}
                    initialData={authorName}
                    showClearButton={false}
                    strokeColor={noteColor?.secondary || "#2a2a2a"}
                  />
                ) : (
                  authorName && (
                    <div
                      style={{
                        width: "280px",
                        height: "200px",
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
                      color: "#BBC2BB",
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
