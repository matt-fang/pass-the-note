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
  const [textOpacity, setTextOpacity] = useState(1);
  const [showAbout, setShowAbout] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [authorNameDrawing, setAuthorNameDrawing] = useState("");
  const [isNoteFlipped, setIsNoteFlipped] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);
  const [notesSlideOut, setNotesSlideOut] = useState(false);
  const [slideAnimationComplete, setSlideAnimationComplete] = useState(false);
  const [showSentContent, setShowSentContent] = useState(false);
  const [questionHistory, setQuestionHistory] = useState<
    Array<{
      question: string;
      shareUrl: string;
      noteColor: (typeof NOTE_COLORS)[0];
      textOffset: { x: number; y: number };
    }>
  >([]);
  const flipNoteRef = useRef<FlippableNoteRef>(null);

  // Preload note images
  const noteImages = NOTE_COLORS.map((color) => color.bg);
  const imagesLoaded = useImagePreloader(noteImages);

  // Load question immediately when component mounts
  useEffect(() => {
    const loadInitialNote = async () => {
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

    loadInitialNote();
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

  const getNewQuestion = async () => {
    // Fade out text only
    setTextOpacity(0);

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

        // Save current question to history before setting new one
        setQuestionHistory((prev) => [
          ...prev,
          {
            question,
            shareUrl,
            noteColor,
            textOffset,
          },
        ]);

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
        setTimeout(() => {
          setTextOpacity(1);
        }, 50);
      }
    } catch (error) {
      console.error("Error getting new question:", error);
      setTextOpacity(1); // Reset opacity on error
    }
  };

  const goBackToPreviousQuestion = () => {
    if (questionHistory.length > 0) {
      // Fade out text only
      setTextOpacity(0);

      const previousQuestion = questionHistory[questionHistory.length - 1];

      // Restore previous question data
      setQuestion(previousQuestion.question);
      setShareUrl(previousQuestion.shareUrl);
      setNoteColor(previousQuestion.noteColor);
      setTextOffset(previousQuestion.textOffset);

      // Remove the last item from history
      setQuestionHistory((prev) => prev.slice(0, -1));

      // Reset signature when going back
      setAuthorNameDrawing("");

      // Fade back in
      setTimeout(() => {
        setTextOpacity(1);
      }, 50);
    }
  };

  const shareNatively = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          url: url,
        });
      } catch {
        // User cancelled, do nothing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Clipboard API failed, do nothing
      }
    }
  };

  const passNote = async () => {
    // Save signature before sharing
    if (authorNameDrawing && shareUrl) {
      try {
        const shareUrlPath = shareUrl.split("/").pop(); // Extract shareUrl from full URL
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

    // Open native sharing interface immediately
    await shareNatively(shareUrl);

    // Trigger animation and passed state
    setNotesSlideOut(true);
    setTimeout(() => {
      setSlideAnimationComplete(true);
      setHasPassed(true);
      // Start fade-in of sent content after a brief delay
      setTimeout(() => {
        setShowSentContent(true);
      }, 100);
    }, 600); // Wait for slide animation to complete
  };

  const noteSize = 320; // Keep note size consistent across mobile and desktop
  const fontSize = 18;

  // Show loading until images are preloaded
  if (!imagesLoaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--cream)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            alignItems: "center",
            fontFamily: "var(--font-sans)",
            fontSize: "16px",
            lineHeight: "22px",
            color: "#989797",
            fontWeight: "500",
            marginTop: "24px",
            display: "block",
          }}
        >
          <i>
            {" "}
            &quot;What happens when people open their hearts?&quot; <br />
            &quot;They get better.&quot; <br /> <br />{" "}
          </i>
          ― Haruki Murakami
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        height: hasPassed ? "100vh" : "auto",
        overflow: hasPassed ? "hidden" : "visible", // Changed from 'hidden' to allow shadow
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: hasPassed ? "center" : "center",
        background: "var(--cream)",
        padding: hasPassed ? "0" : "0 20px",
        position: "relative",
      }}
    >
      <Header
        showAbout={showAbout}
        onAboutChange={setShowAbout}
        defaultMusicOn={false}
      />

      {/* Main Content */}
      {!slideAnimationComplete && (
        <div
          style={{
            flex: 1, // <-- allow this div to grow
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center", // <-- vertically center its children
            gap: isMobile ? "15px" : "50px",
            transform: notesSlideOut ? "translateY(-100vh)" : "translateY(0)",
            transition: "transform 0.6s ease-in-out",
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
                noteColor={noteColor}
                frontContent={
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-handwritten)",
                        fontSize: `${fontSize}px`,
                        lineHeight: "1.4",
                        color: "var(--text-dark)",
                        textAlign: "center",
                        width: "100%",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: `translate(calc(-50% + ${textOffset.x}px), calc(-50% + ${textOffset.y}px))`,
                        opacity: textOpacity,
                        transition: "opacity 0.2s ease-in-out",
                      }}
                    >
                      {question}
                    </div>
                  </div>
                }
              />
            </div>
          </div>

          {/* Bottom buttons with 80pt spacing */}
          {!hasPassed && (
            <div
              style={{
                marginTop: "10px", // 80pt spacing between note and button
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              {/* Back button - show when flipped OR when there's question history */}
              {(isNoteFlipped || questionHistory.length > 0) && (
                <button
                  onClick={() => {
                    if (isNoteFlipped) {
                      // Fade out text first, then flip back
                      setTextOpacity(0);
                      setTimeout(() => {
                        setIsNoteFlipped(false);
                        setTextOpacity(1);
                      }, 50);
                    } else {
                      goBackToPreviousQuestion();
                    }
                  }}
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

              {/* Shuffle button - only show when not flipped */}
              {!isNoteFlipped && (
                <button
                  onClick={getNewQuestion}
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
                  shuffle
                </button>
              )}

              {/* Clear button - only show when flipped */}
              {isNoteFlipped && (
                <button
                  onClick={() => {
                    setAuthorNameDrawing("");
                    if (flipNoteRef.current) {
                      flipNoteRef.current.handleClear();
                    }
                  }}
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
                  clear
                </button>
              )}

              {/* Main action button */}
              <button
                onClick={async () => {
                  if (!isNoteFlipped) {
                    // If not flipped, flip to signing screen
                    setIsNoteFlipped(true);
                  } else {
                    // If flipped and signed, pass the note
                    await passNote();
                  }
                }}
                disabled={!shareUrl || (isNoteFlipped && !authorNameDrawing)}
                style={{
                  background:
                    !shareUrl || (isNoteFlipped && !authorNameDrawing)
                      ? "#E5E1DE"
                      : "#FF5E01",
                  border: "none",
                  fontFamily: "var(--font-sans)",
                  fontWeight: "500",
                  fontSize: "14px",
                  lineHeight: "18px",
                  color:
                    !shareUrl || (isNoteFlipped && !authorNameDrawing)
                      ? "black"
                      : "white",
                  cursor:
                    !shareUrl || (isNoteFlipped && !authorNameDrawing)
                      ? "default"
                      : "pointer",
                  padding: "8px 10px",
                }}
              >
                {!isNoteFlipped ? "1. sign this note >" : "2. pass this note >"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Passed state - shows after note is passed */}
      {hasPassed && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--cream)",
            zIndex: 1000,
            opacity: showSentContent ? 1 : 0,
            transition: "opacity 0.4s ease-in-out",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: "40px",
              padding: "0 20px",
              width: "66.67%",
              maxWidth: "300px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                fontSize: "16px",
                lineHeight: "22px",
                color: "var(--text-dark)",
              }}
            >
              passed! come back to this link anytime to see new notes on this
              chain.
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                width: "100%",
              }}
            >
              <button
                onClick={async () => {
                  await shareNatively(shareUrl);
                }}
                style={{
                  background: "#E5E1DE",
                  border: "none",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "18px",
                  color: "black",
                  cursor: "pointer",
                  padding: "8px 10px",
                }}
              >
                get the share link again
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                style={{
                  background: "#FF5E01",
                  border: "none",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "18px",
                  color: "white",
                  cursor: "pointer",
                  padding: "8px 10px",
                }}
              >
                write another note &gt;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
