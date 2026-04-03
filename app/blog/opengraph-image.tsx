import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Blog | GOATED. Software & AI Automation Agency";
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
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: "#E8533A", display: "flex" }} />
        <div style={{ display: "flex", alignItems: "center", marginBottom: "40px", fontSize: "24px" }}>
          <span style={{ color: "#666" }}>[</span>
          <span style={{ color: "#FFFFFF", fontWeight: 700 }}>GOATED</span>
          <span style={{ color: "#E8533A", fontWeight: 700 }}>.</span>
          <span style={{ color: "#666" }}>]</span>
          <span style={{ color: "#666", fontSize: "14px", marginLeft: "16px", letterSpacing: "2px", textTransform: "uppercase" as const }}>Blog</span>
        </div>
        <div style={{ fontSize: "56px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.15, marginBottom: "24px", display: "flex" }}>
          Insights & Guides
        </div>
        <div style={{ fontSize: "24px", color: "#999999", lineHeight: 1.5, maxWidth: "700px", display: "flex" }}>
          Practical thinking on software development, AI automation, and building businesses that run themselves.
        </div>
        <div style={{ position: "absolute", bottom: "40px", left: "80px", display: "flex", gap: "16px" }}>
          {["Engineering", "AI Automation", "Strategy", "Industry"].map((tag) => (
            <span key={tag} style={{ fontSize: "12px", color: "#999", border: "1px solid #333", borderRadius: "20px", padding: "4px 12px" }}>{tag}</span>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
