"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import DrawingCanvas from "@/components/DrawingCanvas";
import FlippableNote, { FlippableNoteRef } from "@/components/FlippableNote";
import Header from "@/components/Header";

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

export default function NotePage() {
  const params = useParams();
  const shareUrl = params.shareUrl as string;

  const [thread, setThread] = useState<Thread | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);
  const [textOffset, setTextOffset] = useState({ x: 0, y: 0 });
  const [responseNoteOffset, setResponseNoteOffset] = useState({
    x: 0,
    y: 0,
    rotation: 0,
    color: NOTE_COLORS[0],
  });
  const [existingResponseOffsets, setExistingResponseOffsets] = useState<
    Array<{
      x: number;
      y: number;
      rotation: number;
      color: (typeof NOTE_COLORS)[0];
    }>
  >([]);
  const [showAbout, setShowAbout] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);
  const [notesSlideOut, setNotesSlideOut] = useState(false);
  const [showReadView, setShowReadView] = useState(false);
  const [authorNameDrawing, setAuthorNameDrawing] = useState("");
  const [flippedNotes, setFlippedNotes] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [typedResponse, setTypedResponse] = useState("");
  const activeNoteRef = useRef<FlippableNoteRef>(null);

  // Deterministic random function based on string input
  const seededRandom = (seed: string): number => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  };

  useEffect(() => {
    if (params.shareUrl) {
      // Check if user has already responded to this note
      const hasRespondedKey = `responded_${params.shareUrl}`;
      const hasResponded = localStorage.getItem(hasRespondedKey) === "true";

      if (hasResponded) {
        setShowReadView(true);
      }

      loadThread();
    }
  }, [shareUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set deterministic colors and offsets based on thread data
  useEffect(() => {
    if (thread) {
      // Use thread ID for consistent color selection
      const colorIndex = Math.floor(
        seededRandom(thread.id) * NOTE_COLORS.length
      );
      setNoteColor(NOTE_COLORS[colorIndex]);

      // Use thread ID + "offset" for consistent text positioning
      const offsetSeed = seededRandom(thread.id + "offset");
      setTextOffset({
        x: (offsetSeed - 0.5) * 6, // -3px to 3px
        y: (seededRandom(thread.id + "offset2") - 0.5) * 4, // -2px to 2px
      });

      // Use thread ID + response count for new response positioning
      const responseSeed = seededRandom(
        thread.id + "response" + (thread.responses.length - 1)
      );
      setResponseNoteOffset({
        x: (responseSeed - 0.5) * 40, // -20px to 20px
        y: 0,
        rotation:
          (seededRandom(thread.id + "rotation" + (thread.responses.length - 1)) -
            0.5) *
          6, // -3deg to 3deg
        color: NOTE_COLORS[(colorIndex + 1) % NOTE_COLORS.length], // Different from main note
      });
    }
  }, [thread]);

  const loadThread = async () => {
    try {
      const response = await fetch(`/api/share/${shareUrl}`);
      if (response.ok) {
        const data = await response.json();
        setThread(data.thread);
        setCanEdit(data.canEdit);
      } else {
        console.error("Thread not found");
      }
    } catch (error) {
      console.error("Error loading thread:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Use stored positioning data for existing responses (only for horizontal offset and rotation)
    if (thread && thread.responses.length > 0) {
      const offsets = thread.responses.map((response) => ({
        x: response.positionX,
        y: response.positionY, // Still store but won't use for vertical positioning
        rotation: response.rotation,
        color: {
          bg: response.noteColor,
          secondary: response.noteColorSecondary,
          filter: "none",
        },
      }));
      setExistingResponseOffsets(offsets);
    }
  }, [thread]);

  const submitResponse = async () => {
    if (!typedResponse || !thread) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId: thread.id,
          drawingData: typedResponse, // Use typed response instead of drawing data
          authorName: authorNameDrawing || "",
          positionX: responseNoteOffset.x,
          positionY: responseNoteOffset.y,
          rotation: responseNoteOffset.rotation,
          noteColor: responseNoteOffset.color.bg,
          noteColorSecondary: responseNoteOffset.color.secondary,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const fullUrl = `${window.location.origin}/note/${data.shareUrl}`;
        return fullUrl;
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
    return null;
  };

  const passNote = async () => {
    if (!typedResponse || !thread) return;

    // 1. Submit the response and get share URL
    const shareUrl = await submitResponse();

    if (shareUrl) {
      // 2. Store that user has responded to THIS note
      const hasRespondedKey = `responded_${params.shareUrl}`;
      localStorage.setItem(hasRespondedKey, "true");

      // 3. Open native sharing interface immediately
      await shareNatively(shareUrl);

      // 4. Trigger animation and passed state
      setNotesSlideOut(true);
      setTimeout(() => {
        setHasPassed(true);
        setCanEdit(false);
      }, 600); // Wait for slide animation to complete
    }
  };

  const shareNatively = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Little Notes",
          text: "i sent you a little note.",
          url: url,
        });
      } catch {
        // User cancelled, do nothing
      }
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--cream)",
          padding: "0 20px",
        }}
      >
        <Header showAbout={showAbout} onAboutChange={setShowAbout} />
        <div
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--text-dark)",
          }}
        >
          loading...
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div
        style={{
          minHeight: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--cream)",
          padding: "0 20px",
        }}
      >
        <Header showAbout={showAbout} onAboutChange={setShowAbout} />

        {/* Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "40px",
          }}
        >
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
            note not found.
          </div>

          <div
            style={{
              width: "320px",
              height: "320px",
              background: "var(--note-beige)",
              boxShadow: "var(--note-shadow)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-handwritten)",
                fontSize: "18px",
                lineHeight: "1.4",
                color: "var(--text-dark)",
                textAlign: "center",
                width: "100%",
              }}
            >
              This note link is invalid or has expired.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user has already responded, show read view
  if (showReadView && thread) {
    return (
      <div
        style={{
          minHeight: "100vh",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          background: "var(--cream)",
          padding: "0 20px",
          paddingTop: "140px",
          paddingBottom: "120px",
        }}
      >
        <Header showAbout={showAbout} onAboutChange={setShowAbout} />

        {/* Read View Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "40px",
          }}
        >
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
            you&apos;ve already responded to this note.
            <br />
            here&apos;s the conversation so far.
          </div>

          {/* Note Container - Read Only */}
          <div
            style={{
              position: "relative",
              minHeight: `${Math.max(
                320,
                ...thread.responses.slice(1).map((r) => 314 + (r.positionY || 0) + 320)
              )}px`,
            }}
          >
            {/* Main Question Note */}
            <div
              style={{
                width: "320px",
                height: "320px",
                background: noteColor.bg,
                boxShadow: "var(--note-shadow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-handwritten)",
                  fontSize: "18px",
                  lineHeight: "1.4",
                  color: "var(--text-dark)",
                  textAlign: "center",
                  width: "100%",
                  transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
                }}
              >
                {thread.question}
              </div>
            </div>

            {/* All Response Notes */}
            {thread.responses.length > 1 &&
              thread.responses.slice(1).map((response, index) => {
                if (!response.drawingData || response.drawingData.trim() === '') return null;

                const offset = existingResponseOffsets[index + 1] || {
                  x: 0,
                  y: 0,
                  rotation: 0,
                  color: NOTE_COLORS[0],
                };

                return (
                  <div
                    key={response.id}
                    style={{
                      position: "absolute",
                      top: `${314 + offset.y}px`,
                      left: `${offset.x}px`,
                      zIndex: 100 + index + 1,
                    }}
                  >
                    <FlippableNote
                      width={320}
                      height={320}
                      background={offset.color.bg}
                      authorName={response.authorName || ""}
                      style={{
                        transform: `rotate(${offset.rotation}deg)`,
                      }}
                      frontContent={
                        <DrawingCanvas
                          width={240}
                          height={240}
                          initialData={response.drawingData}
                          disabled={true}
                          showClearButton={false}
                        />
                      }
                    />
                  </div>
                );
              })}
          </div>

          <button
            onClick={() => (window.location.href = "/")}
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
              marginTop: "40px",
            }}
          >
            write your own note &gt;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: thread.responses.length > 1 ? "flex-start" : "center",
        background: "var(--cream)",
        padding: "0 20px",
        paddingTop: thread.responses.length > 1 ? "140px" : "0",
        paddingBottom: thread.responses.length > 1 ? "120px" : "0",
      }}
    >
      <Header showAbout={showAbout} onAboutChange={setShowAbout} />

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "40px",
        }}
      >
        {/* Text above note */}
        {canEdit && (
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
            your friend passed you this note.
            <br />
            write your answer below.
          </div>
        )}

        {/* Note Container - Simple Vertical Stack */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "-5px", // 5px overlap between notes
            transform: notesSlideOut ? "translateX(100vw)" : "translateX(0)",
            transition: "transform 0.6s ease-in-out",
          }}
        >
          {/* Main Question Note */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              transform: `translate(${textOffset.x}px, ${textOffset.y}px)`,
            }}
          >
            <FlippableNote
              width={320}
              height={320}
              background={noteColor.bg}
              authorName={thread.responses[0]?.authorName || ""}
              isFlipped={flippedNotes["question-note"] || false}
              frontContent={
                <div
                  style={{
                    width: "240px",
                    height: "240px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-handwritten)",
                    fontSize: "18px",
                    lineHeight: "1.4",
                    color: "var(--text-dark)",
                    textAlign: "center",
                    padding: "20px",
                    overflow: "hidden",
                    wordBreak: "break-word",
                  }}
                >
                  {thread.question}
                </div>
              }
            />

            {/* Toolbar for question note */}
            <div
              style={{
                width: "54px",
                height: "320px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Flip button only */}
              <button
                onClick={() =>
                  setFlippedNotes((prev) => ({
                    ...prev,
                    "question-note": !prev["question-note"],
                  }))
                }
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/flip.svg"
                  alt="flip"
                  style={{
                    height: "14px",
                    width: "auto",
                    filter: "brightness(0)",
                  }}
                />
              </button>
            </div>
          </div>

          {/* Existing Response Notes */}
          {thread.responses.length > 1 &&
            thread.responses.slice(1).map((response, index) => {
              if (!response.drawingData || response.drawingData.trim() === '') return null;

              const offset = existingResponseOffsets[index + 1] || {
                x: 0,
                y: 0,
                rotation: 0,
                color: NOTE_COLORS[0],
              };
              const noteId = `response-${response.id}`;
              const isFlipped = flippedNotes[noteId] || false;

              return (
                <div
                  key={response.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transform: `translate(${offset.x}px, 0) rotate(${offset.rotation}deg)`,
                    zIndex: 100 + index + 1,
                  }}
                >
                  <FlippableNote
                    width={320}
                    height={320}
                    background={offset.color.bg}
                    authorName={response.authorName || ""}
                    isFlipped={isFlipped}
                    frontContent={
                      // Check if it's SVG, old image data, or text
                      response.drawingData.startsWith("<svg") ? (
                        <div
                          style={{
                            width: "240px",
                            height: "240px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: response.drawingData,
                          }}
                        />
                      ) : response.drawingData.startsWith("data:image") ? (
                        <div
                          style={{
                            width: "240px",
                            height: "240px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundImage: `url(${response.drawingData})`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "240px",
                            height: "240px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "var(--font-handwritten)",
                            fontSize: "18px",
                            lineHeight: "1.4",
                            color: "var(--text-dark)",
                            textAlign: "center",
                            padding: "20px",
                            overflow: "hidden",
                            wordBreak: "break-word",
                          }}
                        >
                          {response.drawingData}
                        </div>
                      )
                    }
                  />

                  {/* Toolbar for existing notes */}
                  <div
                    style={{
                      width: "54px",
                      height: "320px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Flip button only */}
                    <button
                      onClick={() =>
                        setFlippedNotes((prev) => ({
                          ...prev,
                          [noteId]: !prev[noteId],
                        }))
                      }
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
                          width: "auto",
                          filter: "brightness(0)",
                        }}
                      />
                    </button>
                  </div>
                </div>
              );
            })}

          {/* Active Response Note */}
          {canEdit && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                transform: `translate(${responseNoteOffset.x}px, 0) rotate(${responseNoteOffset.rotation}deg)`,
                zIndex: 200,
              }}
            >
              <FlippableNote
                ref={activeNoteRef}
                width={320}
                height={320}
                background={responseNoteOffset.color.bg}
                isEditable={true}
                authorName={authorNameDrawing}
                onAuthorNameChange={setAuthorNameDrawing}
                isFlipped={flippedNotes["active-note"] || false}
                isTypingMode={true}
                typedText={typedResponse}
                onTextChange={setTypedResponse}
              />

              {/* Toolbar for active note with flip + undo */}
              <div
                style={{
                  width: "54px",
                  height: "320px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "18px",
                }}
              >
                {/* Flip button */}
                <button
                  onClick={() =>
                    setFlippedNotes((prev) => ({
                      ...prev,
                      "active-note": !prev["active-note"],
                    }))
                  }
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
                      width: "auto",
                      filter: "brightness(0)",
                    }}
                  />
                </button>

                {/* Undo button - only for active note */}
                <button
                  onClick={() => {
                    if (flippedNotes["active-note"] && activeNoteRef.current) {
                      activeNoteRef.current.handleUndo();
                    }
                  }}
                  disabled={!flippedNotes["active-note"]}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: flippedNotes["active-note"] ? "pointer" : "default",
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: flippedNotes["active-note"] ? 1 : 0.5,
                  }}
                >
                  <img
                    src="/undo.svg"
                    alt="undo"
                    style={{
                      height: "14px",
                      width: "auto",
                      filter: flippedNotes["active-note"]
                        ? "brightness(0)"
                        : "brightness(0) saturate(100%) invert(73%) sepia(0%) saturate(2%) hue-rotate(169deg) brightness(96%) contrast(86%)",
                    }}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pass button - shows when user has typed something */}
        {canEdit && !hasPassed && (
          <button
            onClick={() => {
              if (!authorNameDrawing.trim()) {
                // No signature yet → flip to the back so they can sign
                setFlippedNotes((prev) => ({
                  ...prev,
                  "active-note": !prev["active-note"],
                }));
              } else {
                // Name is present → go ahead and pass the note
                passNote();
              }
            }}
            disabled={
              isSubmitting ||
              !typedResponse.trim() ||
              !authorNameDrawing.trim()
            }
            style={{
              background:
                isSubmitting || !typedResponse.trim() || !authorNameDrawing.trim() ? "#E5E1DE" : "#FF5E01",
              border: "none",
              fontFamily: "var(--font-sans)",
              fontWeight: "500",
              fontSize: "14px",
              lineHeight: "18px",
              color: isSubmitting || !typedResponse.trim() || !authorNameDrawing.trim() ? "black" : "white",
              cursor:
                isSubmitting || !typedResponse.trim() || !authorNameDrawing.trim() ? "default" : "pointer",
              padding: "8px 10px",
              marginTop: "40px",
            }}
          >
            {isSubmitting ? "sending your note..." : "pass the note on >"}
          </button>
        )}

        {/* Passed state - shows after note is passed */}
        {hasPassed && (
          <div
            style={{
              textAlign: "center",
              marginTop: "40px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: "500",
                fontSize: "24px",
                lineHeight: "30px",
                color: "var(--text-dark)",
                marginBottom: "20px",
              }}
            >
              passed!
            </div>
            <button
              onClick={() => (window.location.href = "/")}
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
              write your own note &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
