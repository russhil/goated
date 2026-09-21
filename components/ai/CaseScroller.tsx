"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { CASES, type CaseStudy } from "@/lib/ai/content";
import { DistributorBefore, OrderDeskBefore, RoyaltyBefore } from "./CaseBefore";
import { DistributorDemo, OrderDeskDemo, RoyaltyDemo } from "./CaseDemos";

// Pinned case studies on native scroll. Each case owns two viewport-heights of
// the track: in the first, its messy "before" wipes into the working "after"
// (left to right) while the big number turns from the old cost into the
// saving; in the second, the next case wipes up over it. Per-frame values
// are CSS variables (--r reveal, clip on entry), so scrolling never
// re-renders React. Reduced motion shows each case's after state, stacked.

const VIEWS: Record<CaseStudy["demo"], { Before: ComponentType; After: ComponentType<{ active: boolean }> }> = {
  orders: { Before: OrderDeskBefore, After: OrderDeskDemo },
  distributor: { Before: DistributorBefore, After: DistributorDemo },
  royalty: { Before: RoyaltyBefore, After: RoyaltyDemo },
};

const THEMES = [
  { bg: "bg-dark text-white", fill: "bg-dark", money: "text-[#FF9E82]", sub: "text-white/65", rule: "border-white/15", dark: true },
  { bg: "bg-[#F4F1EA] text-dark", fill: "bg-[#F4F1EA]", money: "text-coral", sub: "text-gray-600", rule: "border-dark/10", dark: false },
  { bg: "bg-white text-dark", fill: "bg-white", money: "text-coral", sub: "text-gray-600", rule: "border-dark/10", dark: false },
];

const clamp = (v: number) => Math.min(1, Math.max(0, v));

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
  const { Before, After } = VIEWS[c.demo];
  return (
    <div className={`${t.bg} flex h-full flex-col`}>
      <div className="mx-auto flex h-full w-full max-w-[1100px] flex-col justify-center px-5 pb-24 pt-8 md:px-12 md:py-12">
        <p className={`font-sans text-sm font-semibold md:text-base ${t.sub}`}>
          {c.client} <span className="opacity-50">·</span> {c.system}
        </p>
        <div className="mt-4 grid min-h-0 gap-5 md:mt-6 md:grid-cols-[1.3fr_1fr] md:items-center md:gap-14">
          <div className="flex min-h-0 flex-col md:order-1">
            <p className="font-sans text-lg font-bold leading-snug md:text-2xl">{c.story}</p>
            <div className="relative mt-4 h-[250px] md:mt-6 md:h-[400px]">
              <div className="ai-before-layer absolute inset-0">
                <Before />
              </div>
              <div className={`ai-after-layer absolute inset-0 ${t.fill}`}>
                <After active={active} />
              </div>
              <span className="ai-divider pointer-events-none absolute inset-y-[-6px] w-[3px] rounded-full bg-coral" aria-hidden="true" />
              <span className="ai-tag-before absolute -top-3 left-3 rounded-full bg-gray-500 px-2.5 py-0.5 font-sans text-[11px] font-bold uppercase tracking-wide text-white">
                Before
              </span>
              <span className="ai-tag-after absolute -top-3 left-3 rounded-full bg-coral px-2.5 py-0.5 font-sans text-[11px] font-bold uppercase tracking-wide text-white">
                After GOATED
              </span>
            </div>
            <Flow steps={c.flow} dark={t.dark} />
          </div>
          <div className="relative order-first md:order-2">
            <div className="ai-stat-before absolute inset-x-0 top-0">
              <p className={`ai-lining font-sans font-extrabold leading-[0.95] tracking-[-0.035em] ${t.dark ? "text-white/45" : "text-dark/35"}`} style={{ fontSize: "clamp(2.9rem, 8vw, 6rem)" }}>
                {c.beforeStat}
              </p>
              <p className="mt-2 font-sans text-lg font-semibold md:text-2xl">{c.beforeUnit}</p>
            </div>
            <div className="ai-stat-after">
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
    </div>
  );
}

export default function CaseScroller() {
  const track = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(-1);
  const [reduced, setReduced] = useState(false);
  const units = CASES.length * 2 - 1;

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
      const p = clamp(-rect.top / (rect.height - window.innerHeight)) * units;
      let live = -1;
      panels.current.forEach((panel, i) => {
        if (!panel) return;
        const enter = i === 0 ? 1 : clamp(p - (2 * i - 1));
        const reveal = clamp((p - 2 * i) / 0.6);
        panel.style.clipPath = i === 0 ? "" : `inset(${(1 - enter) * 100}% 0 0 0)`;
        panel.style.setProperty("--r", reveal.toFixed(4));
        if (enter > 0.5 && reveal > 0.5) live = i;
      });
      setActive(live);
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
  }, [reduced, units]);

  if (reduced) {
    return (
      <div>
        {CASES.map((c, i) => (
          <section key={c.client} className="min-h-[100svh]" style={{ ["--r" as string]: 1 }}>
            <Panel c={c} i={i} active />
          </section>
        ))}
      </div>
    );
  }

  return (
    <div ref={track} style={{ height: `${(units + 1) * 100}svh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {CASES.map((c, i) => (
          <div
            key={c.client}
            ref={(el) => {
              panels.current[i] = el;
            }}
            className="absolute inset-0 will-change-[clip-path]"
            style={{ clipPath: i === 0 ? undefined : "inset(100% 0 0 0)", ["--r" as string]: 0 }}
          >
            <Panel c={c} i={i} active={i === active} />
          </div>
        ))}
      </div>
    </div>
  );
}
