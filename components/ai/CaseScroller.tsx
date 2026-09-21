"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CASES, type CaseStudy } from "@/lib/ai/content";
import { DistributorDemo, OrderDeskDemo, RoyaltyDemo } from "./CaseDemos";

// Pinned case studies. The page scrolls natively; a sticky stage holds one
// panel per case, and each next panel wipes up over the last as the reader
// scrolls through that case's share of the track. Reduced motion gets the
// same panels stacked in normal flow.

const DEMOS: Record<CaseStudy["demo"], (p: { active: boolean }) => ReactNode> = {
  orders: OrderDeskDemo,
  distributor: DistributorDemo,
  royalty: RoyaltyDemo,
};

const THEMES = [
  { bg: "bg-dark text-white", money: "text-[#FF9E82]", sub: "text-white/65", rule: "border-white/15" },
  { bg: "bg-[#F4F1EA] text-dark", money: "text-coral", sub: "text-gray-600", rule: "border-dark/10" },
  { bg: "bg-white text-dark", money: "text-coral", sub: "text-gray-600", rule: "border-dark/10" },
];

// The chain of hands a task used to pass through, with the manual step struck.
function Flow({ steps, dark }: { steps: CaseStudy["flow"]; dark: boolean }) {
  return (
    <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-sans text-[13px] font-semibold md:mt-4 md:text-sm">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-2">
          {i > 0 && <span className={dark ? "text-white/40" : "text-dark/30"} aria-hidden="true">→</span>}
          <span
            className={
              s.cut
                ? `line-through decoration-coral decoration-2 ${dark ? "text-white/45" : "text-dark/40"}`
                : s.label === "AI"
                  ? "rounded-full bg-coral px-2.5 py-0.5 text-white"
                  : ""
            }
          >
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Panel({ c, i, active }: { c: CaseStudy; i: number; active: boolean }) {
  const t = THEMES[i % THEMES.length];
  const Demo = DEMOS[c.demo];
  return (
    <div className={`${t.bg} flex h-full flex-col`}>
      <div className="mx-auto flex h-full w-full max-w-[1100px] flex-col justify-center px-5 pb-24 pt-8 md:px-12 md:py-12">
        <p className={`font-sans text-sm font-semibold md:text-base ${t.sub}`}>
          {c.client} <span className="opacity-50">·</span> {c.system}
        </p>
        <div className="mt-4 grid min-h-0 gap-5 md:mt-6 md:grid-cols-[1.3fr_1fr] md:items-center md:gap-14">
          <div className="flex min-h-0 flex-col md:order-1">
            <p className="font-sans text-lg font-bold leading-snug md:text-2xl">{c.story}</p>
            <div className="mt-4 h-[230px] md:mt-6 md:h-[400px]">
              <Demo active={active} />
            </div>
            <Flow steps={c.flow} dark={i % THEMES.length === 0} />
          </div>
          <div className="order-first flex flex-col md:order-2 md:justify-center">
            <p className={`ai-lining font-sans font-extrabold leading-[0.95] tracking-[-0.035em] ${t.money}`} style={{ fontSize: "clamp(2.9rem, 8vw, 6rem)" }}>
              {c.saved}
            </p>
            <p className="mt-2 font-sans text-lg font-semibold md:text-2xl">{c.savedUnit}</p>
            <dl className="mt-4 hidden md:mt-8 md:block">
              {c.rows.map((r) => (
                <div key={r.label} className={`flex items-baseline justify-between gap-4 border-t py-3 ${t.rule}`}>
                  <dt className={`font-sans text-base ${t.sub}`}>{r.label}</dt>
                  <dd className="ai-lining font-sans text-lg font-bold">{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CaseScroller() {
  const track = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = track.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable)) * (CASES.length - 1);
      panels.current.forEach((p, i) => {
        if (!p || i === 0) return;
        // Panel i wipes in across progress (i - 1) → i, top edge rising.
        const local = Math.min(1, Math.max(0, progress - (i - 1)));
        p.style.clipPath = `inset(${(1 - local) * 100}% 0 0 0)`;
      });
      setActive(Math.min(CASES.length - 1, Math.round(progress)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced]);

  if (reduced) {
    return (
      <div>
        {CASES.map((c, i) => (
          <section key={c.client} className="min-h-[100svh]">
            <Panel c={c} i={i} active />
          </section>
        ))}
      </div>
    );
  }

  return (
    <div ref={track} style={{ height: `${CASES.length * 100}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {CASES.map((c, i) => (
          <div
            key={c.client}
            ref={(el) => {
              panels.current[i] = el;
            }}
            className="absolute inset-0 will-change-[clip-path]"
            style={i === 0 ? undefined : { clipPath: "inset(100% 0 0 0)" }}
            aria-hidden={i !== active}
          >
            <Panel c={c} i={i} active={i === active} />
          </div>
        ))}
        <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-2 md:flex" aria-hidden="true">
          {CASES.map((c, i) => (
            <span key={c.client} className={`h-8 w-1 rounded-full transition-colors duration-300 ${i === active ? "bg-coral" : "bg-gray-400/40"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
