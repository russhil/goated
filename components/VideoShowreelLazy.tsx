"use client";

import { useEffect, useRef, useState } from "react";
import VideoShowreel from "./VideoShowreel";
import { initFirstInteractionListeners } from "@/lib/firstInteraction";

function Placeholder() {
  return (
    <section
      aria-hidden
      className="px-6 md:px-12 py-16 md:py-24 max-w-[1400px] mx-auto"
    >
      <div className="section-label">{"// showreel"}</div>
      <h2
        className="font-serif text-dark leading-[1.15] mb-10 md:mb-14"
        style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
      >
        We&apos;re GOATED. <span className="italic text-coral">See for yourself.</span>
      </h2>
      <div
        className="relative rounded-2xl overflow-hidden bg-dark/5"
        style={{ aspectRatio: "16 / 9" }}
      />
    </section>
  );
}

// Defers VideoShowreel's hydration effects (IntersectionObserver, listeners,
// poster fetch, .mp4 fetch) until a sentinel scrolls into view. The component
// code is in the initial bundle but its useEffects don't run until mount.
export default function VideoShowreelLazy() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);

  // Register first-interaction listeners ASAP (this wrapper mounts on initial
  // page load — VideoShowreel itself doesn't, so it would otherwise miss the
  // user's first scroll).
  useEffect(() => {
    initFirstInteractionListeners();
  }, []);

  useEffect(() => {
    if (shouldMount) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldMount]);

  if (shouldMount) return <VideoShowreel />;

  return (
    <>
      <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />
      <Placeholder />
    </>
  );
}
