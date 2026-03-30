"use client";

import { useEffect, useRef, useState } from "react";

const ITEMS = [
  {
    num: "01",
    heading: "We start with your problem, not our stack.",
    desc: "Most agencies sell you their preferred technology. We map your workflow first, then pick the right tool for the job.",
  },
  {
    num: "02",
    heading: "We build things that actually get used.",
    desc: "Beautiful software that nobody uses is worthless. Every build goes through real operational testing with your team.",
  },
  {
    num: "03",
    heading: "We move fast. Unusually fast.",
    desc: "Our first working prototype lands in your hands within 2 weeks. You give feedback on real software, not mockups.",
  },
  {
    num: "04",
    heading: "We disappear when the job is done.",
    desc: "No lock-in. No retainer dependency. We document everything, hand it over clean, and you own it fully.",
  },
];

export default function WhatMakesDifferent() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handleScroll = () => {
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;

      // How far we've scrolled into the section (0 = top of section at top of viewport)
      const scrolledInto = -rect.top;

      // Total scrollable distance within the section (minus one viewport for the sticky)
      const totalScrollable = sectionHeight - viewportHeight;
      if (totalScrollable <= 0) return;

      // Raw progress 0..1
      const rawProgress = scrolledInto / totalScrollable;
      const clamped = Math.max(0, Math.min(1, rawProgress));

      // Map to index: each item gets an equal slice of scroll distance
      // Snap to the nearest integer — no in-between states
      const rawIndex = clamped * (ITEMS.length - 1);
      const snappedIndex = Math.round(rawIndex);

      setActiveIndex(snappedIndex);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      id="different"
      ref={sectionRef}
      className="relative w-full bg-white"
      style={{
        // Each card gets 175vh of scroll distance — heavy friction, can't skip
        height: `${ITEMS.length * 170}vh`,
      }}
    >
      {/* Sticky viewport — stays pinned while you scroll through the tall container */}
      <div className="sticky top-0 h-screen flex items-center overflow-hidden px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto w-full relative">
          {/* Section label */}
          <div className="section-label mb-4">{"// the difference"}</div>

          <h2
            className="font-serif text-dark leading-[1.15] mb-12"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
          >
            Why GOATED.
          </h2>

          <div className="relative min-h-[280px]">
            {ITEMS.map((item, i) => {
              const isActive = i === activeIndex;
              const direction = i - activeIndex; // negative = above, positive = below

              return (
                <div
                  key={item.num}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    opacity: isActive ? 1 : 0,
                    transform: `translateY(${direction * 30}px)`,
                    transition:
                      "opacity 450ms cubic-bezier(0.4, 0, 0.2, 1), transform 450ms cubic-bezier(0.4, 0, 0.2, 1)",
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                >
                  {/* Large faded number */}
                  <span className="text-8xl font-serif text-gray-100 absolute -top-4 left-0 select-none">
                    {item.num}
                  </span>

                  {/* Content */}
                  <div className="pt-20 max-w-2xl">
                    <h3 className="text-2xl font-bold text-[#0D0D0D] mt-2">
                      {item.heading}
                    </h3>
                    <p className="text-base text-gray-500 mt-3 max-w-xl">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress dots — right edge */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3">
            {ITEMS.map((_, i) => {
              const isActive = i === activeIndex;

              return (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: isActive ? "8px" : "6px",
                    height: isActive ? "8px" : "6px",
                    backgroundColor: isActive ? "#E8533A" : "#E5E7EB",
                    transform: isActive ? "scale(1.25)" : "scale(1)",
                    transition: "all 400ms cubic-bezier(0.4, 0, 0.2, 1)",
                    opacity: isActive ? 1 : 0.4,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
