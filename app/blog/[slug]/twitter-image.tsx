import { ImageResponse } from "next/og";
import { blogPosts } from "@/lib/blogPosts";

export const runtime = "edge";
export const alt = "Blog Post | GOATED.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateImageMetadata({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  return [{ id: "tw", alt: post ? post.title : "Blog | GOATED.", size, contentType }];
}

export default async function Image({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  const title = post?.title ?? "Blog Post";
  const category = post?.category ?? "";
  const readTime = post?.readTime ?? "";

  return new ImageResponse(
    (
      <div style={{ background: "#0D0D0D", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: "#E8533A", display: "flex" }} />
        <div style={{ display: "flex", alignItems: "center", marginBottom: "32px", fontSize: "20px" }}>
          <span style={{ color: "#666" }}>[</span>
          <span style={{ color: "#FFFFFF", fontWeight: 700 }}>GOATED</span>
          <span style={{ color: "#E8533A", fontWeight: 700 }}>.</span>
          <span style={{ color: "#666" }}>]</span>
        </div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <span style={{ fontSize: "14px", color: "#E8533A", textTransform: "uppercase" as const }}>{category}</span>
          <span style={{ fontSize: "14px", color: "#666" }}>{readTime}</span>
        </div>
        <div style={{ fontSize: "48px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2, display: "flex", maxWidth: "1000px" }}>
          {title}
        </div>
      </div>
    ),
    { ...size }
  );
}
