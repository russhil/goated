"use client";

import { useRef } from "react";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

const INDUSTRIES = [
  "Music & Entertainment",
  "Independent Labels",
  "Tattoo & Creative Studios",
  "Physiotherapy & Healthcare",
  "Streetwear & Fashion",
  "D2C E-Commerce",
  "AI & Productivity Tools",
  "Logistics & Ops",
];

const CARDS = [
  {
    num: "01",
    title: "Music & Entertainment",
    desc: "Royalty splits, catalogue systems, artist-facing tools. We've built the operational backbone for independent labels and artists at scale.",
  },
  {
    num: "02",
    title: "Healthcare & Clinics",
    desc: "Booking automation, patient records, billing flows. From physiotherapy clinics to clinic networks across India - we replace the manual with the automatic.",
  },
  {
    num: "03",
    title: "Creative & Commerce",
    desc: "Tattoo studio CRMs, streetwear storefronts, D2C order pipelines. We build the software that lets creative businesses stop doing admin and start creating.",
  },
];

export default function Industries() {
  const sectionRef = useRef<HTMLElement>(null);
  useRevealOnScroll(sectionRef);

  const pills = [...INDUSTRIES, ...INDUSTRIES];

  return (
    <section
      ref={sectionRef}
      id="industries"
      className="py-20 md:py-32"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="section-label reveal">// who we work with</div>
        <h2
          className="font-serif text-dark leading-[1.15] mb-16 reveal"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
        >
          Industries we&apos;ve transformed.
        </h2>
      </div>

      {/* Ticker */}
      <div className="overflow-hidden mb-20 reveal">
        <div className="ticker-track-slow flex gap-4 w-max">
          {pills.map((name, i) => (
            <span
              key={i}
              className="inline-block px-6 py-3 bg-white border border-[#0D0D0D]/10 text-[#0D0D0D] rounded-full font-sans text-sm whitespace-nowrap"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Industry cards */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
          {CARDS.map((card) => (
            <div
              key={card.num}
              className="reveal border-t border-dark/10 pt-8"
            >
              <span className="font-serif text-4xl text-dark/15 block mb-4">
                {card.num}
              </span>
              <h3 className="font-serif text-xl text-dark mb-3">
                {card.title}
              </h3>
              <p className="font-sans text-sm text-muted leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
