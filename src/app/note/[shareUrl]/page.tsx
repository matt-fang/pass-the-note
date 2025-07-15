"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import FlippableNote, { FlippableNoteRef } from "@/components/FlippableNote";
import Header from "@/components/Header";
import { useImagePreloader } from "@/hooks/useImagePreloader";

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
  {
    bg: "/orangenote.jpg",
    secondary: "var(--note-orange-secondary)",
    filter:
      "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)",
  },
];

// Orange note color for the original question
const ORANGE_NOTE_COLOR = NOTE_COLORS[3]; // Orange is at index 3

export default function NotePage() {
  const params = useParams();
  const shareUrl = params.shareUrl as string;

  const [thread, setThread] = useState<Thread | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preload note images
  const noteImages = NOTE_COLORS.map((color) => color.bg);
  const imagesLoaded = useImagePreloader(noteImages);
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

  // Get random crossout stroke SVG path
  const getCrossoutStroke = (seed: string): string => {
    const crossoutFiles = [
      "crossout1.png",
      "crossout2.png",
      "crossout3.png",
      "crossout4.png",
      "crossout5.png",
    ];
    const randomIndex = Math.floor(seededRandom(seed) * crossoutFiles.length);
    return `/${crossoutFiles[randomIndex]}`;
  };

  // Generate random color ensuring no adjacent duplicates
  const getRandomColor = useCallback(
    (
      seed: string,
      prevColor?: (typeof NOTE_COLORS)[0]
    ): (typeof NOTE_COLORS)[0] => {
      const availableColors = prevColor
        ? NOTE_COLORS.filter((color) => color.bg !== prevColor.bg)
        : NOTE_COLORS;

      const randomIndex = Math.floor(
        seededRandom(seed) * availableColors.length
      );
      return availableColors[randomIndex];
    },
    []
  );

  // Generate random x-offset
  const getRandomXOffset = useCallback((seed: string): number => {
    return (seededRandom(seed) - 0.5) * 16; // -8px to +8px
  }, []);

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
      // Calculate random x-offset: -8px to +8px
      const xOffset = (responseSeed - 0.5) * 16; // Random between -8 and +8
      setResponseNoteOffset({
        x: xOffset,
        y: 0,
        rotation: 0, // No rotation
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
      const offsets = thread.responses.map((response, index) => {
        // Get previous color for adjacent check (skip first response which is the original question)
        const prevColor =
          index > 1
            ? {
                bg: thread.responses[index - 1].noteColor,
                secondary: thread.responses[index - 1].noteColorSecondary,
                filter: "none",
              }
            : undefined;

        // Use stored data if available, otherwise generate random data
        const color = response.noteColor
          ? {
              bg: response.noteColor,
              secondary: response.noteColorSecondary,
              filter: "none",
            }
          : getRandomColor(response.id + "color", prevColor);

        const xOffset =
          response.positionX !== null && response.positionX !== undefined
            ? response.positionX
            : getRandomXOffset(response.id + "xoffset");

        return {
          x: xOffset,
          y: response.positionY, // Still store but won't use for vertical positioning
          rotation: response.rotation || 0,
          color: color,
        };
      });
      setExistingResponseOffsets(offsets);
    }
  }, [thread, getRandomColor, getRandomXOffset]);

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
          rotation: 0, // Always 0 rotation
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

  if (isLoading || !imagesLoaded) {
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
                ...thread.responses
                  .slice(1)
                  .map((r) => 314 + (r.positionY || 0) + 320)
              )}px`,
            }}
          >
            {/* Main Question Note */}
            <div
              style={{
                width: "320px",
                height: "320px",
                backgroundImage: `url(${ORANGE_NOTE_COLOR.bg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
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
                  color: ORANGE_NOTE_COLOR.secondary,
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
                if (!response.drawingData || response.drawingData.trim() === "")
                  return null;

                const offset =
                  existingResponseOffsets[index + 1] ||
                  (() => {
                    // Get previous color for adjacent check
                    const prevColor =
                      index > 0
                        ? existingResponseOffsets[index]?.color
                        : undefined;
                    return {
                      x: getRandomXOffset(response.id + "xoffset"),
                      y: 0,
                      rotation: 0,
                      color: getRandomColor(response.id + "color", prevColor),
                    };
                  })();

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
                        transform: `rotate(0deg)`,
                      }}
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
                              width: "280px",
                              height: "240px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              padding: "19px",
                              boxSizing: "border-box",
                            }}
                          >
                            {/* Answer text */}
                            <div
                              style={{
                                fontFamily: "var(--font-sans)",
                                fontSize: "16px", // Updated to match new font size
                                lineHeight: "22px", // Updated to match new line height
                                fontWeight: "500",
                                color: offset.color.secondary,
                                textAlign: "left",
                                overflow: "hidden",
                                wordBreak: "break-word",
                                flex: 1,
                                marginBottom: "19px",
                              }}
                            >
                              {response.drawingData}
                            </div>

                            {/* Signature at bottom */}
                            {response.authorName && (
                              <div
                                style={{
                                  height: "34px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transform: "scale(0.33)",
                                  transformOrigin: "center",
                                }}
                                dangerouslySetInnerHTML={{
                                  __html: response.authorName,
                                }}
                              />
                            )}
                          </div>
                        )
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
        height: hasPassed ? "100vh" : "auto",
        overflow: hasPassed ? "hidden" : "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: hasPassed ? "center" : "flex-start",
        background: "var(--cream)",
        padding: hasPassed ? "0" : "0 20px",
        paddingTop: hasPassed ? "0" : "140px",
        paddingBottom: hasPassed ? "0" : "120px",
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
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0px", // Zero spacing between signature and text
            }}
          >
            {/* Previous person's signature */}
            {thread.responses.length > 0 &&
              thread.responses[thread.responses.length - 1]?.authorName && (
                <div
                  style={{
                    transform: "scale(0.75)",
                    transformOrigin: "center",
                    filter: "brightness(0) saturate(100%) invert(0%)", // Make it black
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      thread.responses[thread.responses.length - 1].authorName,
                  }}
                />
              )}

            {/* Text below signature */}
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: "500",
                fontSize: "16px",
                lineHeight: "22px",
                color: "var(--text-dark)",
              }}
            >
              passed this note chain to you
            </div>
          </div>
        )}
        {/* Note Container - Absolute Positioned for Overlap */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: (() => {
              // Calculate total height based on actual overlap amounts
              let totalHeight = 320; // Base question note height

              // Add height for existing responses
              for (let i = 0; i < thread.responses.length - 1; i++) {
                const overlapSeed = seededRandom(
                  (thread.responses[i + 1]?.id || "default") + "overlap"
                );
                const overlap = 13 + overlapSeed * 13; // 13-26px overlap
                totalHeight += 320 - overlap;
              }

              // Add height for active response note if editing
              if (canEdit) {
                const activeSeed = seededRandom(thread.id + "active-response");
                const activeOverlap = 13 + activeSeed * 13;
                totalHeight += 320 - activeOverlap;
              }

              return `${totalHeight}px`;
            })(),
            transform: notesSlideOut ? "translateY(-100vh)" : "translateY(0)",
            transition: "transform 0.6s ease-in-out",
          }}
        >
          {/* Main Question Note */}
          <div
            style={{
              position: "absolute",
              top: "0px",
              left: "50%",
              transform: `translateX(-50%) translate(${textOffset.x}px, ${textOffset.y}px)`,
              zIndex: 100,
            }}
          >
            <FlippableNote
              width={320}
              height={320}
              background={ORANGE_NOTE_COLOR.bg}
              noteColor={ORANGE_NOTE_COLOR}
              authorName={thread.responses[0]?.authorName || ""}
              isFlipped={flippedNotes["question-note"] || false}
              frontContent={
                <div
                  style={{
                    width: "280px",
                    height: "240px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "19px",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Question text */}
                  <div
                    style={{
                      fontFamily: "var(--font-handwritten)",
                      fontSize: "18px",
                      lineHeight: "1.4",
                      color: ORANGE_NOTE_COLOR.secondary,
                      textAlign: "center",
                      overflow: "hidden",
                      wordBreak: "break-word",
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "19px",
                    }}
                  >
                    {thread.question}
                  </div>

                  {/* Signature at bottom */}
                  {thread.responses[0]?.authorName && (
                    <div
                      style={{
                        height: "34px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: "scale(0.33)",
                        transformOrigin: "center",
                        filter: ORANGE_NOTE_COLOR.filter,
                      }}
                      dangerouslySetInnerHTML={{
                        __html: thread.responses[0].authorName,
                      }}
                    />
                  )}
                </div>
              }
            />
          </div>

          {/* Existing Response Notes */}
          {thread.responses.length > 1 &&
            thread.responses.slice(1).map((response, index) => {
              if (!response.drawingData || response.drawingData.trim() === "")
                return null;

              const offset =
                existingResponseOffsets[index + 1] ||
                (() => {
                  // Get previous color for adjacent check
                  const prevColor =
                    index > 0
                      ? existingResponseOffsets[index]?.color
                      : undefined;
                  return {
                    x: getRandomXOffset(response.id + "xoffset"),
                    y: 0,
                    rotation: 0,
                    color: getRandomColor(response.id + "color", prevColor),
                  };
                })();
              const noteId = `response-${response.id}`;
              const isFlipped = flippedNotes[noteId] || false;

              // Calculate overlap for this note (-13 to -26px)
              const overlapSeed = seededRandom(response.id + "overlap");
              const overlap = 13 + overlapSeed * 13; // 13-26px overlap

              // Calculate cumulative top position
              let cumulativeTop = 320; // Start after the question note
              for (let i = 0; i < index; i++) {
                const prevSeed = seededRandom(
                  (thread.responses[i + 1]?.id || "default") + "overlap"
                );
                const prevOverlap = 13 + prevSeed * 13;
                cumulativeTop += 320 - prevOverlap;
              }
              cumulativeTop -= overlap; // Apply current note's overlap

              return (
                <div
                  key={response.id}
                  style={{
                    position: "absolute",
                    top: `${cumulativeTop}px`,
                    left: "50%",
                    transform: `translateX(-50%) translate(${offset.x}px, 0)`,
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
                            width: "280px",
                            height: "240px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            padding: "19px",
                            boxSizing: "border-box",
                          }}
                        >
                          {/* Answer text */}
                          <div
                            style={{
                              fontFamily: "var(--font-sans)",
                              fontSize: "16px", // Updated to match new font size
                              lineHeight: "22px", // Updated to match new line height
                              fontWeight: "500",
                              color: offset.color.secondary,
                              textAlign: "left",
                              overflow: "hidden",
                              wordBreak: "break-word",
                              flex: 1,
                              marginBottom: "19px",
                            }}
                          >
                            {response.drawingData}
                          </div>

                          {/* Signature at bottom - crossout for non-first connections */}
                          {response.authorName && (
                            <div
                              style={{
                                height: "34px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transformOrigin: "center",
                              }}
                            >
                              {index === 0 ? (
                                // First connection - show actual signature
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: response.authorName,
                                  }}
                                />
                              ) : (
                                // Farther connections - show crossout stroke
                                <Image
                                  src={getCrossoutStroke(response.id)}
                                  alt="crossed out signature"
                                  width={128}
                                  height={32}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )
                    }
                  />
                </div>
              );
            })}

          {/* Active Response Note */}
          {canEdit &&
            (() => {
              // Calculate position for active response note
              const activeSeed = seededRandom(thread.id + "active-response");
              const activeOverlap = 13 + activeSeed * 13; // 13-26px overlap

              // Calculate cumulative top position for active note
              let activeTop = 320; // Start after the question note
              for (let i = 0; i < thread.responses.length - 1; i++) {
                const prevSeed = seededRandom(
                  (thread.responses[i + 1]?.id || "default") + "overlap"
                );
                const prevOverlap = 13 + prevSeed * 13;
                activeTop += 320 - prevOverlap;
              }
              activeTop -= activeOverlap; // Apply current note's overlap

              return (
                <div
                  style={{
                    position: "absolute",
                    top: `${activeTop}px`,
                    left: "50%",
                    transform: `translateX(-50%) translate(${responseNoteOffset.x}px, 0)`,
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
                    noteColor={responseNoteOffset.color}
                    onUndo={() => activeNoteRef.current?.handleUndo()}
                  />
                </div>
              );
            })()}
        </div>
        {/* Bottom buttons - always show when editing */}
        {canEdit && !hasPassed && (
          <div
            style={{
              marginTop: "40px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* Back button - only show when flipped */}
            {flippedNotes["active-note"] && (
              <button
                onClick={() =>
                  setFlippedNotes((prev) => ({
                    ...prev,
                    "active-note": false,
                  }))
                }
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
                if (!flippedNotes["active-note"]) {
                  // If not flipped, flip to signing screen
                  setFlippedNotes((prev) => ({
                    ...prev,
                    "active-note": true,
                  }));
                } else {
                  // If flipped and signed, pass the note
                  await passNote();
                }
              }}
              disabled={
                isSubmitting ||
                !typedResponse.trim() ||
                (flippedNotes["active-note"] && !authorNameDrawing.trim())
              }
              style={{
                background:
                  isSubmitting ||
                  !typedResponse.trim() ||
                  (flippedNotes["active-note"] && !authorNameDrawing.trim())
                    ? "#E5E1DE"
                    : "#FF5E01",
                border: "none",
                fontFamily: "var(--font-sans)",
                fontWeight: "500",
                fontSize: "14px",
                lineHeight: "18px",
                color:
                  isSubmitting ||
                  !typedResponse.trim() ||
                  (flippedNotes["active-note"] && !authorNameDrawing.trim())
                    ? "black"
                    : "white",
                cursor:
                  isSubmitting ||
                  !typedResponse.trim() ||
                  (flippedNotes["active-note"] && !authorNameDrawing.trim())
                    ? "default"
                    : "pointer",
                padding: "8px 10px",
              }}
            >
              {isSubmitting
                ? "sending your note..."
                : !flippedNotes["active-note"]
                ? "1. sign this note >"
                : "2. pass this note >"}
            </button>
          </div>
        )}
        {/* Passed state - shows after note is passed */}
        {hasPassed && (
          <div
            style={{
              display: "flex",
              alignItems: "center", // vertical centering
              justifyContent: "center", // horizontal centering
              height: "100vh", // full viewport height
              width: "100%",
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
                width: "100%",
                maxWidth: "400px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  fontSize: "18px",
                  lineHeight: "24px",
                  color: "var(--text-dark)",
                }}
              >
                sent! check this link again when
                <br />
                your friend fills out their note.
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
                    const shareUrl = window.location.href;
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
                  pass this note again &gt;
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
                  or, write your own note &gt;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
