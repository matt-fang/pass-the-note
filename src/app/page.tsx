"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import FlippableNote, { FlippableNoteRef } from "@/components/FlippableNote";
import { useImagePreloader } from "@/hooks/useImagePreloader";

const NOTE_COLORS = [
  {
    bg: "/greennote.jpg",
    secondary: "var(--note-green-secondary)",
    filter:
      "brightness(0) saturate(100%) invert(49%) sepia(8%) saturate(1128%) hue-rotate(75deg) brightness(95%) contrast(87%)",
  },
  {
    bg: "/bluenote.jpg",
    secondary: "var(--note-blue-secondary)",
    filter:
      "brightness(0) saturate(100%) invert(55%) sepia(18%) saturate(1045%) hue-rotate(166deg) brightness(95%) contrast(92%)",
  },
  {
    bg: "/beigenote.jpg",
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
  
  // Preload note images
  const noteImages = NOTE_COLORS.map(color => color.bg);
  const imagesLoaded = useImagePreloader(noteImages);

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
        body: JSON.stringify({}),
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
        body: JSON.stringify({}),
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

        // Reset signature when getting new question
        setAuthorNameDrawing("");

        // Fade back in
        setTimeout(() => setNoteOpacity(1), 50);
      }
    } catch (error) {
      console.error("Error getting new question:", error);
      setNoteOpacity(1); // Reset opacity on error
    }
  };

  const shareNatively = async () => {
    // Save signature before sharing
    if (authorNameDrawing && shareUrl) {
      try {
        const shareUrlPath = shareUrl.split('/').pop(); // Extract shareUrl from full URL
        await fetch("/api/thread", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shareUrl: shareUrlPath,
            authorName: authorNameDrawing,
          }),
        });
      } catch (error) {
        console.error("Error saving signature:", error);
      }
    }

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

  // Show loading until images are preloaded
  if (!imagesLoaded) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--cream)",
      }}>
        <div style={{
          fontFamily: "var(--font-sans)",
          color: "var(--text-light)",
        }}>
          Loading...
        </div>
      </div>
    );
  }

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

        {/* Note Container */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 20px", // Extra space for shadow (61px + buffer)
            overflow: "visible",
          }}
        >

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
              onUndo={() => {
                if (flipNoteRef.current) {
                  flipNoteRef.current.handleUndo();
                }
              }}
              frontContent={
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-handwritten)",
                      fontSize: `${fontSize}px`,
                      lineHeight: "1.4",
                      color: "var(--text-dark)",
                      textAlign: "center",
                      width: "100%",
                      transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: `translate(-50%, -50%) translate(${textOffset.x}px, ${textOffset.y}px)`,
                    }}
                  >
                    {question}
                  </div>
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
                        }}
                      >
                        shuffle
                      </span>
                    </button>
                  )}
                </div>
              }
            />

          </div>

        </div>

        {/* Bottom buttons with 80pt spacing */}
        <div
          style={{
            marginTop: "10px", // 80pt spacing between note and button
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* Back button - only show when flipped */}
          {isNoteFlipped && (
            <button
              onClick={() => setIsNoteFlipped(false)}
              style={{
                background: "#E5E1DE",
                border: "none",
                fontFamily: "var(--font-sans)",
                fontWeight: "500",
                fontSize: "14px",
                lineHeight: "18px",
                color: "black",
                cursor: "pointer",
                padding: "8px 10px",
              }}
            >
              &lt;
            </button>
          )}
          
          {/* Main action button */}
          <button
            onClick={async () => {
              if (!isNoteFlipped) {
                // If not flipped, flip to signing screen
                setIsNoteFlipped(true);
              } else {
                // If flipped and signed, share the note
                await shareNatively();
              }
            }}
            disabled={!shareUrl || (isNoteFlipped && !authorNameDrawing)}
            style={{
              background:
                !shareUrl || (isNoteFlipped && !authorNameDrawing) ? "#E5E1DE" : "#FF5E01",
              border: "none",
              fontFamily: "var(--font-sans)",
              fontWeight: "500",
              fontSize: "14px",
              lineHeight: "18px",
              color: !shareUrl || (isNoteFlipped && !authorNameDrawing) ? "black" : "white",
              cursor: !shareUrl || (isNoteFlipped && !authorNameDrawing) ? "default" : "pointer",
              padding: "8px 10px",
            }}
          >
            {!isNoteFlipped 
              ? "sign this note &gt;" 
              : "pass this note to a friend &gt;"
            }
          </button>
        </div>
      </div>
    </div>
  );
}
