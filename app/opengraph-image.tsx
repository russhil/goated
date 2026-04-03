import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "GOATED. | Custom Software & AI Automation Agency in Mumbai, India";
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
            fontSize: "64px",
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.15,
            marginBottom: "24px",
            maxWidth: "900px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Custom Software &amp;</span>
          <span>AI Automation Agency</span>
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
          We build bespoke software, AI-powered workflows, and automation
          systems from scratch. Based in Mumbai, India.
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
            goatedd.tech
          </span>
          <span
            style={{
              fontSize: "14px",
              color: "#E8533A",
              letterSpacing: "3px",
              textTransform: "uppercase" as const,
            }}
          >
            Mumbai, India
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
