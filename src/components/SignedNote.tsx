import Image from "next/image";

interface SignedNoteProps {
  drawingData: string;
  authorName: string;
  noteColor: {
    bg: string;
    secondary: string;
    filter: string;
  };
  shouldShowSignature: boolean;
  crossoutStroke: string;
}

export default function SignedNote({
  drawingData,
  authorName,
  noteColor,
  shouldShowSignature,
  crossoutStroke,
}: SignedNoteProps) {
  const isTextContent = !drawingData.startsWith("<svg") && !drawingData.startsWith("data:image");

  return (
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
      {isTextContent ? (
        <>
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              padding: "0",
              marginBottom: "19px",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                fontFamily: "var(--font-sans)",
                fontSize: "16px",
                lineHeight: "22px",
                fontWeight: "500",
                color: noteColor.secondary,
                textAlign: "left",
                overflow: "hidden",
                wordBreak: "break-word",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                padding: "0",
              }}
            >
              {drawingData}
            </div>
          </div>

          {authorName && (
            <div
              style={{
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transformOrigin: "center",
                marginBottom: "20px",
              }}
            >
              {shouldShowSignature ? (
                <div
                  style={{
                    transform: "scale(0.33)",
                    transformOrigin: "center",
                    opacity: 0.3,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: authorName,
                  }}
                />
              ) : (
                <Image
                  src={crossoutStroke}
                  alt="crossed out signature"
                  width={128}
                  height={32}
                />
              )}
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            width: "240px",
            height: "240px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...(drawingData.startsWith("data:image") && {
              backgroundImage: `url(${drawingData})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }),
          }}
          {...(drawingData.startsWith("<svg") && {
            dangerouslySetInnerHTML: {
              __html: drawingData,
            },
          })}
        />
      )}
    </div>
  );
}