import { ImageResponse } from "next/og";
import { caseStudies } from "@/lib/caseStudies";

export const runtime = "edge";
export const alt = "Case Study | GOATED.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateImageMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const cs = caseStudies.find((c) => c.id === params.slug);
  return [
    {
      id: "og",
      alt: cs
        ? `${cs.title} | ${cs.subtitle} | GOATED.`
        : "Case Study | GOATED.",
      size,
      contentType,
    },
  ];
}

export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const cs = caseStudies.find((c) => c.id === params.slug);

  const title = cs?.title ?? "Case Study";
  const subtitle = cs?.subtitle ?? "";
  const client = cs?.client ?? "";
  const stat = cs?.resultStat ?? "";
  const category = cs?.category ?? "";
  const tags = cs?.tags ?? [];

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
            marginBottom: "32px",
            fontSize: "20px",
          }}
        >
          <span style={{ color: "#666" }}>[</span>
          <span style={{ color: "#FFFFFF", fontWeight: 700 }}>GOATED</span>
          <span style={{ color: "#E8533A", fontWeight: 700 }}>.</span>
          <span style={{ color: "#666" }}>]</span>
          <span
            style={{
              color: "#666",
              fontSize: "14px",
              marginLeft: "16px",
              letterSpacing: "2px",
              textTransform: "uppercase" as const,
            }}
          >
            Case Study
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <span
            style={{
              fontSize: "13px",
              color: "#FFFFFF",
              border: "1px solid #444",
              borderRadius: "20px",
              padding: "4px 14px",
              textTransform: "uppercase" as const,
              letterSpacing: "1px",
            }}
          >
            {category}
          </span>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "13px",
                color: "#999",
                border: "1px solid #333",
                borderRadius: "20px",
                padding: "4px 14px",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div
          style={{
            fontSize: "56px",
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.15,
            marginBottom: "8px",
            display: "flex",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "28px",
            color: "#999999",
            marginBottom: "16px",
            display: "flex",
          }}
        >
          {subtitle}
        </div>

        <div style={{ fontSize: "16px", color: "#666", display: "flex" }}>
          {client}
        </div>

        {stat ? (
          <div
            style={{
              position: "absolute",
              bottom: "80px",
              left: "80px",
              fontSize: "28px",
              color: "#E8533A",
              fontWeight: 600,
              display: "flex",
            }}
          >
            {stat}
          </div>
        ) : null}

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
          <span style={{ fontSize: "14px", color: "#666", letterSpacing: "2px" }}>
            goatedd.tech
          </span>
          <span style={{ fontSize: "14px", color: "#666" }}>
            Software & AI Automation Agency
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
