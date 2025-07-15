"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import FlippableNote, { FlippableNoteRef } from "@/components/FlippableNote";

const NOTE_COLORS = [
  {
    bg: "var(--note-green)",
    secondary: "var(--note-green-secondary)",
    filter:
      "brightness(0) saturate(100%) invert(49%) sepia(8%) saturate(1128%) hue-rotate(75deg) brightness(95%) contrast(87%)",
  },
  {
    bg: "var(--note-blue)",
    secondary: "var(--note-blue-secondary)",
    filter:
      "brightness(0) saturate(100%) invert(55%) sepia(18%) saturate(1045%) hue-rotate(166deg) brightness(95%) contrast(92%)",
  },
  {
    bg: "var(--note-beige)",
    secondary: "var(--note-beige-secondary)",
    filter:
      "brightness(0) saturate(100%) invert(71%) sepia(12%) saturate(361%) hue-rotate(351deg) brightness(97%) contrast(91%)",
  },
];

export default function Home() {
  const [shareUrl, setShareUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);
  const [textOffset, setTextOffset] = useState({ x: 0, y: 0 });
  const [noteOpacity, setNoteOpacity] = useState(1);
  const [showAbout, setShowAbout] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [authorNameDrawing, setAuthorNameDrawing] = useState("");
  const [isNoteFlipped, setIsNoteFlipped] = useState(false);
  const flipNoteRef = useRef<FlippableNoteRef>(null);

  // Load question immediately when component mounts
  useEffect(() => {
    createNewNote();
  }, []);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const createNewNote = async () => {
    try {
      const response = await fetch("/api/thread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorName: authorNameDrawing,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestion(data.question);
        const fullUrl = `${window.location.origin}/note/${data.shareUrl}`;
        setShareUrl(fullUrl);

        // Set random note color
        const randomColor =
          NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
        setNoteColor(randomColor);

        // Set random text offset
        setTextOffset({
          x: (Math.random() - 0.5) * 6, // -3px to 3px
          y: (Math.random() - 0.5) * 4, // -2px to 2px
        });
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const getNewQuestion = async () => {
    // Instant fade out
    setNoteOpacity(0);

    try {
      const response = await fetch("/api/thread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorName: authorNameDrawing,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update everything instantly
        setQuestion(data.question);
        const fullUrl = `${window.location.origin}/note/${data.shareUrl}`;
        setShareUrl(fullUrl);

        // Set random note color
        const randomColor =
          NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
        setNoteColor(randomColor);

        // Set random text offset
        setTextOffset({
          x: (Math.random() - 0.5) * 6, // -3px to 3px
          y: (Math.random() - 0.5) * 4, // -2px to 2px
        });

        // Fade back in
        setTimeout(() => setNoteOpacity(1), 50);
      }
    } catch (error) {
      console.error("Error getting new question:", error);
      setNoteOpacity(1); // Reset opacity on error
    }
  };

  const shareNatively = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Little Notes",
          text: "i sent you a little note.",
          url: shareUrl,
        });
      } catch {
        // User cancelled, do nothing
      }
    }
  };

  const noteSize = 320; // Keep note size consistent across mobile and desktop
  const fontSize = 18;

  return (
    <div
      style={{
        minHeight: "100vh",
        overflow: "visible", // Changed from 'hidden' to allow shadow
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--cream)",
        padding: "0 20px",
        position: "relative",
      }}
    >
      <Header showAbout={showAbout} onAboutChange={setShowAbout} />

      {/* Main Content */}
      <div
        style={{
          flex: 1, // <-- allow this div to grow
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center", // <-- vertically center its children
          gap: isMobile ? "15px" : "50px",
        }}
      >
        {/* Text above note */}
        <div
          style={{
            textAlign: "center",
            fontFamily: "var(--font-sans)",
            fontWeight: "500",
            fontSize: "16px",
            lineHeight: "22px",
            color: "var(--text-dark)",
          }}
        >
          {isNoteFlipped ? (
            <>
              sign it! (legibly)
              <br />
              <span
                style={{
                  color: "var(--text-light)",
                  fontStyle: "italic",
                  fontWeight: "400",
                }}
              >
                this is only visible to who you send it to
              </span>
            </>
          ) : (
            <>
              pass a little note to a friend.
              <br />
              start a big conversation.
            </>
          )}
        </div>

        {/* H-Stack Layout: Left Toolbar Frame | Note | Right Toolbar Frame */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 20px", // Extra space for shadow (61px + buffer)
            gap: "14px", // 14px spacing between frames
            overflow: "visible",
          }}
        >
          {/* Left Toolbar Frame - 54px wide (empty for now) */}
          <div
            style={{
              width: "54px",
              height: `${noteSize}px`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Empty for now */}
          </div>

          {/* Note - centered */}
          <div
            style={{
              opacity: noteOpacity,
              transition: "opacity 0.2s ease-in-out",
              position: "relative",
            }}
          >
            <FlippableNote
              ref={flipNoteRef}
              width={noteSize}
              height={noteSize}
              background={noteColor.bg}
              isEditable={true}
              authorName={authorNameDrawing}
              onAuthorNameChange={setAuthorNameDrawing}
              isFlipped={isNoteFlipped}
              frontContent={
                <div
                  style={{
                    fontFamily: "var(--font-handwritten)",
                    fontSize: `${fontSize}px`,
                    lineHeight: "1.4",
                    color: "var(--text-dark)",
                    textAlign: "center",
                    width: "100%",
                    transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
                  }}
                >
                  {question}
                </div>
              }
            />

            {/* Shuffle button - positioned at bottom of note */}
            {question && (
              <button
                onClick={getNewQuestion}
                style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "var(--text-dark)",
                    opacity: noteOpacity,
                    transition: "opacity 0.2s ease-in-out",
                  }}
                >
                  shuffle
                </span>
              </button>
            )}
          </div>

          {/* Right Toolbar Frame - 54px wide with v-stack icons */}
          <div
            style={{
              width: "54px",
              height: `${noteSize}px`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "18px",
            }}
          >
            {/* Flip button - black */}
            <button
              onClick={() => setIsNoteFlipped(!isNoteFlipped)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="/flip.svg"
                alt="flip"
                style={{
                  height: "14px",
                  width: "auto", // Maintain aspect ratio like header icons
                  filter: "brightness(0)", // Makes it black
                }}
              />
            </button>

            {/* Undo button - black when active, gray when inactive */}
            <button
              onClick={() => {
                if (isNoteFlipped && flipNoteRef.current) {
                  flipNoteRef.current.handleUndo();
                }
              }}
              disabled={!isNoteFlipped}
              style={{
                background: "none",
                border: "none",
                cursor: isNoteFlipped ? "pointer" : "default",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: isNoteFlipped ? 1 : 0.5,
              }}
            >
              <img
                src="/undo.svg"
                alt="undo"
                style={{
                  height: "14px",
                  width: "auto", // Maintain aspect ratio like header icons
                  filter: isNoteFlipped
                    ? "brightness(0)"
                    : "brightness(0) saturate(100%) invert(73%) sepia(0%) saturate(2%) hue-rotate(169deg) brightness(96%) contrast(86%)",
                }}
              />
            </button>
          </div>
        </div>

        {/* Share button with 80pt spacing */}
        <div
          style={{
            marginTop: "10px", // 80pt spacing between note and button
          }}
        >
          <button
            onClick={() => {
              if (!authorNameDrawing) {
                // If no name is drawn, flip the note to the back for signing
                setIsNoteFlipped(true);
              } else {
                // If name is drawn, share normally
                shareNatively();
              }
            }}
            disabled={!shareUrl}
            style={{
              background:
                !shareUrl || !authorNameDrawing ? "#E5E1DE" : "#FF5E01",
              border: "none",
              fontFamily: "var(--font-sans)",
              fontWeight: "500",
              fontSize: "14px",
              lineHeight: "18px",
              color: !shareUrl || !authorNameDrawing ? "black" : "white",
              cursor: !shareUrl || !authorNameDrawing ? "default" : "pointer",
              padding: "8px 10px",
            }}
          >
            share this note &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
