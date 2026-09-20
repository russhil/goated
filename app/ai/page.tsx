import type { Metadata } from "next";
import LogoTicker from "@/components/LogoTicker";
import AdTracking from "@/components/ai/AdTracking";
import BookCallButton, { StickyBookCall } from "@/components/ai/BookCallButton";
import {
  AUDIT_OFFER,
  CASES,
  CLOSE,
  EYEBROW,
  FAQS,
  HERO,
  PAINS,
  PROOF_HEADING,
  REASSURANCE,
  STEPS,
  resolveVariant,
  type HeroVariant,
} from "@/lib/ai/content";
import "./ai.css";

const CAMPAIGN_LOGOS = ["NBA", "KPMG", "Everest Fleet", "Kiko Live", "DlaN5", "Wear World Peace", "Partner"];

// Paid-traffic landing page. No navigation and no outbound links: the only
// exit is the booking calendar. Headline variant: /ai (a) or /ai?v=b.

export const metadata: Metadata = {
  title: "AI automation for Indian businesses above ₹25 Cr",
  description: HERO.subhead,
  alternates: { canonical: "https://goatedd.tech/ai" },
  robots: { index: false, follow: false },
};

function Brand() {
  return (
    <span className="block font-mono text-sm tracking-tight">
      <span>[</span>
      <span className="font-bold">GOATED</span>
      <span className="font-bold text-coral">.</span>
      <span>]</span>
    </span>
  );
}

function Figure({ before, after, size }: { before: string; after: string; size: string }) {
  return (
    <p className="ai-figure flex flex-wrap items-baseline gap-x-[0.18em]" style={{ fontSize: size }}>
      <span className="ai-before">{before}</span>
      <span className="ai-arrow" style={{ fontSize: "0.5em" }} aria-hidden="true">
        →
      </span>
      <span className="sr-only">to</span>
      <span className="ai-after">{after}</span>
    </p>
  );
}

function Hero({ variant }: { variant: HeroVariant }) {
  const numberLed = variant === "a";
  const figure = (
    <div className={numberLed ? "" : "mt-10 border-t border-dark/10 pt-8"}>
      <Figure
        before={HERO.before}
        after={HERO.after}
        size={numberLed ? "clamp(6rem, 30vw, 17rem)" : "clamp(3.5rem, 14vw, 7rem)"}
      />
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted md:text-xs">
        {HERO.unit} <span className="text-coral">·</span> {HERO.span}
      </p>
    </div>
  );

  return (
    <section className="mx-auto max-w-[1100px] px-6 pb-16 pt-6 md:px-12 md:pb-24 md:pt-8">
      <Brand />
      <p className="mt-10 inline-block rounded-full border border-coral/40 bg-coral/5 px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-coral md:mt-14 md:px-4 md:text-xs md:tracking-[0.12em]">
        {EYEBROW}
      </p>

      <div className="mt-8 md:mt-10">
        {numberLed && figure}
        <h1
          className={`ai-lining font-serif leading-[1.12] text-dark ${numberLed ? "mt-8 max-w-[760px]" : "max-w-[900px]"}`}
          style={{
            fontSize: numberLed ? "clamp(1.7rem, 4.2vw, 3.1rem)" : "clamp(2.1rem, 5.6vw, 4.4rem)",
          }}
        >
          {HERO.headline[variant]}
        </h1>
        {!numberLed && figure}
      </div>

      <p className="ai-rise mt-6 max-w-[620px] font-sans text-base leading-relaxed text-gray-600 md:text-lg" style={{ animationDelay: "1200ms" }}>
        {HERO.subhead}
      </p>

      <div id="hero-cta" className="ai-rise mt-9" style={{ animationDelay: "1350ms" }}>
        <BookCallButton source="hero" />
      </div>
    </section>
  );
}

function Pains() {
  return (
    <section className="border-y border-[#F0F0F0] bg-light/60">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 px-6 md:grid-cols-3 md:px-12">
        {PAINS.map((pain, i) => (
          <div
            key={pain.title}
            className={`py-9 md:px-8 md:py-14 ${i > 0 ? "border-t border-dark/10 md:border-l md:border-t-0" : ""} ${i === 0 ? "md:pl-0" : ""}`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-coral/10 font-sans text-sm font-bold text-coral" aria-hidden="true">
              ✕
            </span>
            <h2 className="mt-5 font-serif text-2xl leading-snug text-dark">{pain.title}</h2>
            <p className="mt-2 font-sans text-[15px] leading-relaxed text-gray-600">{pain.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section className="ai-on-dark ai-static bg-dark text-white">
      <div className="mx-auto max-w-[1100px] px-6 py-16 md:px-12 md:py-28">
        <p className="font-mono text-xs tracking-[0.05em] text-coral">{"// proof"}</p>
        <h2 className="mt-5 font-serif leading-[1.1]" style={{ fontSize: "clamp(2.1rem, 5vw, 3.8rem)" }}>
          {PROOF_HEADING}
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/15 md:mt-16 md:grid-cols-2">
          {CASES.map((c) => (
            <article key={c.sector} className="bg-dark p-7 md:p-10">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-coral">{c.sector}</p>
              <p className="mt-4 font-sans text-[15px] leading-relaxed text-white/70">{c.context}</p>
              <div className="mt-8">
                <Figure before={c.before} after={c.after} size="clamp(2.6rem, 9vw, 4.6rem)" />
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">{c.unit}</p>
              </div>
              <p className="mt-8 border-t border-white/15 pt-5 font-sans text-base leading-relaxed text-white">
                {c.outcome}
              </p>
            </article>
          ))}
        </div>
      </div>
      <div id="proof-end" aria-hidden="true" />
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="mx-auto max-w-[1100px] px-6 py-16 md:px-12 md:py-28">
      <p className="section-label">{"// how it works"}</p>
      <ol className="border-b border-dark/10">
        {STEPS.map((step) => (
          <li key={step.n} className="grid grid-cols-[3rem_1fr] gap-x-4 border-t border-dark/10 py-7 md:grid-cols-[5rem_14rem_1fr] md:items-baseline md:py-9">
            <span className="font-mono text-sm text-coral">{step.n}</span>
            <div>
              <h3 className="font-serif text-2xl text-dark md:text-3xl">{step.title}</h3>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{step.meta}</p>
            </div>
            <p className="col-start-2 mt-3 font-sans text-[15px] leading-relaxed text-gray-600 md:col-start-3 md:mt-0 md:text-base">
              {step.body}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-14 grid grid-cols-1 gap-8 rounded-2xl border border-dark/10 p-7 md:mt-20 md:grid-cols-2 md:gap-14 md:p-12">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-coral">The audit</p>
          <h2 className="mt-4 font-serif leading-[1.15] text-dark" style={{ fontSize: "clamp(1.8rem, 3.6vw, 2.8rem)" }}>
            {AUDIT_OFFER.heading}
          </h2>
        </div>
        <dl className="self-end">
          {AUDIT_OFFER.rows.map((row, i) => {
            const last = i === AUDIT_OFFER.rows.length - 1;
            return (
              <div key={row.label} className={`flex items-baseline justify-between gap-6 border-t py-3.5 ${last ? "border-dark" : "border-dark/10"}`}>
                <dt className={`font-sans text-[15px] ${last ? "font-medium text-dark" : "text-gray-600"}`}>{row.label}</dt>
                <dd className={`font-serif text-xl ${last ? "text-coral" : "text-dark"}`}>{row.value}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

function Reassurance() {
  return (
    <section className="border-t border-[#F0F0F0]">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-6 py-14 md:grid-cols-3 md:gap-12 md:px-12 md:py-20">
        {REASSURANCE.map((item) => (
          <div key={item.title}>
            <h3 className="font-serif text-xl text-dark">{item.title}</h3>
            <p className="mt-2 font-sans text-[15px] leading-relaxed text-gray-600">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="ai-faq mx-auto max-w-[820px] px-6 pb-16 md:px-12 md:pb-28">
      <p className="section-label">{"// questions"}</p>
      <div className="border-b border-dark/10">
        {FAQS.map((faq) => (
          <details key={faq.question} className="border-t border-dark/10">
            <summary className="flex items-center justify-between gap-6 py-5 font-serif text-xl text-dark md:text-2xl">
              {faq.question}
              <span className="ai-faq-mark shrink-0 font-sans text-2xl text-coral transition-transform duration-300" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="pb-6 pr-10 font-sans text-base leading-relaxed text-gray-600">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Close() {
  return (
    <section className="bg-dark text-white">
      <div className="mx-auto max-w-[1100px] px-6 pb-32 pt-16 md:px-12 md:py-28">
        <h2 className="max-w-[760px] font-serif leading-[1.08]" style={{ fontSize: "clamp(2.3rem, 6vw, 4.6rem)" }}>
          {CLOSE.heading}
        </h2>
        <p className="mt-6 max-w-[560px] font-sans text-base leading-relaxed text-white/70 md:text-lg">{CLOSE.body}</p>
        <div className="mt-10">
          <BookCallButton source="close" tone="light" />
        </div>
        <p className="mt-16 font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">
          GOATED<span className="text-coral">.</span> · Mumbai
        </p>
      </div>
    </section>
  );
}

export default function AiLandingPage({
  searchParams,
}: {
  searchParams: { v?: string | string[] };
}) {
  const variant = resolveVariant(searchParams.v);

  return (
    <AdTracking variant={variant}>
      <main>
        <Hero variant={variant} />
        <Pains />
        <Proof />
        <LogoTicker only={CAMPAIGN_LOGOS} />
        <HowItWorks />
        <Reassurance />
        <Faq />
        <Close />
      </main>
      <StickyBookCall />
    </AdTracking>
  );
}
