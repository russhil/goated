import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Our Work | Software & AI Automation Case Studies | GOATED.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0D0D0D",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "#E8533A",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "40px",
            fontSize: "24px",
          }}
        >
          <span style={{ color: "#666" }}>[</span>
          <span style={{ color: "#FFFFFF", fontWeight: 700 }}>GOATED</span>
          <span style={{ color: "#E8533A", fontWeight: 700 }}>.</span>
          <span style={{ color: "#666" }}>]</span>
        </div>

        <div
          style={{
            fontSize: "20px",
            color: "#E8533A",
            letterSpacing: "3px",
            textTransform: "uppercase" as const,
            marginBottom: "16px",
            display: "flex",
          }}
        >
          // case studies
        </div>

        <div
          style={{
            fontSize: "56px",
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.15,
            marginBottom: "24px",
            display: "flex",
          }}
        >
          What we've built.
        </div>

        <div
          style={{
            fontSize: "24px",
            color: "#999999",
            lineHeight: 1.5,
            maxWidth: "700px",
            display: "flex",
          }}
        >
          Custom software and AI automation projects. All live and in
          production.
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "80px",
            right: "80px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "16px", color: "#666", letterSpacing: "2px" }}>
            goated.dev/portfolio
          </span>
          <div style={{ display: "flex", gap: "16px" }}>
            {["AI Automation", "E-Commerce", "CRM", "Healthcare", "Music"].map(
              (tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    border: "1px solid #333",
                    borderRadius: "20px",
                    padding: "4px 12px",
                  }}
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
