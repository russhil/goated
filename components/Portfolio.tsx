"use client";

import { useEffect, useRef, useState } from "react";

const FILTERS = ["SHOW ALL", "CLIENT PROJECTS", "AI AUTOMATION", "INTERNAL TOOLS"];

const CASES = [
  {
    tags: ["MUSIC", "CATALOGUE MANAGEMENT"],
    status: "live",
    title: "Azadi Records — Music Catalogue System",
    client: "Azadi Records, Mumbai",
    desc: "A full catalogue management system for one of India's leading independent hip-hop labels. Tracks royalties, manages ISRC codes, handles track splits across artists and producers, and gives the label a live operational overview of 32+ releases.",
    stat: "Replaced 6 spreadsheets with one system.",
    category: "CLIENT PROJECTS",
  },
  {
    tags: ["E-COMMERCE", "AUTOMATION"],
    status: "building",
    title: "D2C Order Automation Pipeline",
    client: "Undisclosed D2C Brand",
    desc: "End-to-end order processing automation eliminating manual fulfilment tracking. Integrates Shopify, logistics APIs, and a custom ops dashboard into a single source of truth.",
    stat: "847 orders processed without manual touch.",
    category: "AI AUTOMATION",
  },
  {
    tags: ["AI", "LOGISTICS"],
    status: "building",
    title: "AI Shipment Exception Handler",
    client: "Undisclosed Logistics Operator",
    desc: "An AI system that monitors live shipment data, detects exceptions and delays before they escalate, and automatically notifies the right stakeholders with context.",
    stat: "40% reduction in customer escalations.",
    category: "AI AUTOMATION",
  },
  {
    tags: ["INTERNAL TOOLS"],
    status: "live",
    title: "Creator Royalty Dashboard",
    client: "Independent Music Distributor",
    desc: "A real-time royalty calculation and distribution dashboard for a music distributor managing 50+ independent artists. Replaces quarterly manual CSV exports with live split tracking.",
    stat: "From monthly to real-time reporting.",
    category: "INTERNAL TOOLS",
  },
];

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState("SHOW ALL");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const reveals = el.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.05 }
    );
    reveals.forEach((r) => observer.observe(r));
    return () => observer.disconnect();
  }, []);

  const filtered =
    activeFilter === "SHOW ALL"
      ? CASES
      : CASES.filter((c) => c.category === activeFilter);

  return (
    <section
      ref={sectionRef}
      id="portfolio"
      className="min-h-screen px-6 md:px-12 py-20 md:py-32 max-w-[1400px] mx-auto"
    >
      <div className="section-label reveal">// case studies</div>

      <h2
        className="font-serif text-dark leading-[1.15] mb-4 reveal"
        style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
      >
        What we&apos;ve built.
      </h2>

      <p className="font-sans text-muted mb-10 reveal">
        Custom software and AI systems. All live and in production.
      </p>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-3 mb-16 reveal">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-5 py-2 rounded-full text-xs font-sans font-medium tracking-wide transition-all duration-300 border ${
              activeFilter === f
                ? "bg-dark text-white border-dark"
                : "bg-transparent text-dark border-dark/30 hover:border-dark"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Case study grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filtered.map((c, i) => (
          <div key={c.title} className="reveal group" style={{ transitionDelay: `${i * 100}ms` }}>
            {/* Image placeholder */}
            <div className="overflow-hidden rounded-lg mb-5">
              <div className="bg-light aspect-[16/10] flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.03]">
                <span className="font-mono text-sm text-muted">
                  MOCKUP — {c.title.split("—")[0].trim()}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {c.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono tracking-wide text-muted uppercase"
                >
                  {tag}
                </span>
              ))}
              <span className="text-[10px] font-mono tracking-wide text-muted">·</span>
              <span
                className={`text-[10px] font-mono tracking-wide px-2.5 py-0.5 rounded-full border ${
                  c.status === "live"
                    ? "border-green-500 text-green-600"
                    : "border-amber-400 text-amber-500"
                }`}
              >
                {c.status}
              </span>
            </div>

            <h3 className="font-sans text-lg font-bold text-dark mb-1">
              {c.title}
            </h3>
            <p className="font-sans text-xs text-muted mb-3">{c.client}</p>
            <p className="font-sans text-sm text-dark/70 leading-relaxed mb-3">
              {c.desc}
            </p>
            <p className="font-sans text-xs font-medium text-dark/50 mb-4">
              ↳ {c.stat}
            </p>
            <a
              href="#"
              className="font-sans text-sm text-coral hover:underline transition-all"
            >
              View Case Study →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
