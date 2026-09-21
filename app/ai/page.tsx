import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import LogoTicker from "@/components/LogoTicker";
import AdTracking from "@/components/ai/AdTracking";
import BookCallButton, { StickyBookCall } from "@/components/ai/BookCallButton";
import FounderVideo from "@/components/ai/FounderVideo";
import {
  AFTER,
  AFTERCARE,
  BEFORE,
  BUILDS,
  CLIENTS_LABEL,
  CLOSE,
  FAQS,
  FOUNDERS,
  HERO,
  MEASURED,
  METHOD,
  PEOPLE,
  RESULTS,
  resolveVariant,
} from "@/lib/ai/content";
import "./ai.css";

const CAMPAIGN_LOGOS = ["NBA", "KPMG", "Everest Fleet", "Kiko Live", "DlaN5", "Wear World Peace", "Partner"];

// Paid-traffic landing page, read top to bottom like a pitch deck: one
// numbered section per slide. No navigation and no outbound links; the only
// exit is the booking form.

export const metadata: Metadata = {
  title: "AI systems for Indian businesses",
  description: HERO.subhead,
  alternates: { canonical: "https://goatedd.tech/ai" },
  robots: { index: false, follow: false },
};

const CTA_CLASS = "!bg-coral !text-white hover:!bg-dark !text-lg !px-9 !py-[1.15rem]";

// Line icons on a 24px grid, drawn in the current text colour.
const ICONS: Record<string, ReactNode> = {
  inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" /></>,
  factory: <><path d="M2 20V9l6 4V9l6 4V4h4l2 16z" /><path d="M2 20h20" /></>,
  map: <><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  phone: <><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M11 18h2" /></>,
  scale: <path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8" />,
  doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4" /></>,
  chart: <path d="M3 3v18h18M7 16v-4M12 16V8M17 16v-7" />,
  chat: <path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-6.2A8 8 0 1 1 21 12z" />,
  person: <><circle cx="12" cy="7.5" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  spark: <path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z" />,
};

function Icon({ name, size = 26 }: { name: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

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

// A deck slide: numbered marker, heading, then the slide's content.
function Slide({
  n,
  label,
  heading,
  dark = false,
  tint = false,
  children,
}: {
  n: string;
  label: string;
  heading: string;
  dark?: boolean;
  tint?: boolean;
  children: ReactNode;
}) {
  const bg = dark ? "bg-dark text-white" : tint ? "bg-light/70" : "";
  return (
    <section className={`${bg} ${!dark ? "border-t border-[#F0F0F0]" : ""}`}>
      <div className="mx-auto max-w-[1100px] px-5 py-16 md:px-12 md:py-24">
        <p className={`flex items-center gap-3 font-mono text-xs uppercase tracking-[0.14em] ${dark ? "text-[#FF9E82]" : "text-coral"}`}>
          <span className={`rounded-full border px-2.5 py-1 ${dark ? "border-[#FF9E82]/50" : "border-coral/40"}`}>{n}</span>
          {label}
        </p>
        <h2 className="ai-lining mt-5 max-w-[820px] font-serif leading-[1.08]" style={{ fontSize: "clamp(2rem, 4.6vw, 3.4rem)" }}>
          {heading}
        </h2>
        <div className="mt-10 md:mt-14">{children}</div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-[1100px] px-5 pb-14 pt-6 md:px-12 md:pb-24 md:pt-8">
      <Brand />
      <div className="mt-8 grid items-center gap-8 md:mt-14 md:grid-cols-[1.1fr_1fr] md:gap-12">
        <div>
          <p className="inline-block rounded-full bg-coral/10 px-3.5 py-2 font-sans text-[13px] font-semibold text-coral md:text-sm">
            {HERO.eyebrow}
          </p>
          <h1 className="mt-5 font-sans font-extrabold leading-[1.02] tracking-[-0.03em] text-dark" style={{ fontSize: "clamp(2.5rem, 5.4vw, 4.1rem)" }}>
            {HERO.headline}
          </h1>
          <p className="mt-5 max-w-[480px] font-sans text-lg leading-snug text-gray-600 md:text-xl">{HERO.subhead}</p>
        </div>
        <FounderVideo />
      </div>

      <div id="hero-cta" className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 md:mt-12">
        <BookCallButton source="hero" className={CTA_CLASS} />
        <ul className="flex flex-wrap gap-x-5 gap-y-2 font-sans text-[15px] font-medium text-dark">
          {HERO.facts.map((fact) => (
            <li key={fact} className="flex items-center gap-1.5">
              <span className="text-coral" aria-hidden="true">✓</span>
              {fact}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// A vertical chain of steps; the step marked "AI" is the one software does.
function Flow({ steps, close }: { steps: { title: string; who: string }[]; close: string }) {
  return (
    <div className="max-w-[720px]">
      <ol>
        {steps.map((step, i) => {
          const ai = step.who === "AI";
          const last = i === steps.length - 1;
          return (
            <li key={step.title} className="relative flex gap-4 pb-4 md:gap-5">
              {!last && <span className="absolute left-[21px] top-11 h-[calc(100%-2.75rem)] w-0.5 bg-dark/10" aria-hidden="true" />}
              <span
                className={`relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-sans text-base font-bold ${
                  ai ? "bg-coral text-white" : "border-2 border-dark/15 bg-white text-dark"
                }`}
              >
                {i + 1}
              </span>
              <div className={`flex flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl px-4 py-3.5 md:px-5 ${ai ? "bg-coral/10 ring-1 ring-coral/30" : "bg-white ring-1 ring-dark/[0.07]"}`}>
                <span className="font-sans text-base font-semibold leading-snug text-dark md:text-lg">{step.title}</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[13px] font-semibold ${ai ? "bg-coral text-white" : "bg-dark/[0.06] text-dark/70"}`}>
                  <Icon name={ai ? "spark" : "person"} size={14} />
                  {step.who}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-6 font-sans text-lg font-semibold leading-snug text-dark md:text-xl">{close}</p>
    </div>
  );
}

function Measured() {
  return (
    <Slide n={MEASURED.n} label={MEASURED.label} heading={MEASURED.heading} dark>
      <p className="-mt-6 mb-8 font-sans text-base text-white/60 md:-mt-8">{MEASURED.source}</p>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/15 sm:grid-cols-2">
        {MEASURED.stats.map((s) => (
          <div key={s.body} className="bg-dark p-6 md:p-9">
            <p className="font-sans font-extrabold leading-none tracking-[-0.03em] text-[#FF9E82]" style={{ fontSize: "clamp(2.8rem, 7vw, 4.4rem)" }}>
              {s.value}
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-white/50">{s.unit}</p>
            <p className="mt-4 font-sans text-lg leading-snug text-white md:text-xl">{s.body}</p>
          </div>
        ))}
      </div>
      <figure className="mt-10 max-w-[760px] border-l-2 border-[#FF9E82] pl-5 md:mt-14">
        <blockquote className="font-serif text-2xl leading-snug md:text-3xl">&ldquo;{MEASURED.quote}&rdquo;</blockquote>
        <figcaption className="mt-3 font-sans text-sm text-white/60">{MEASURED.quoteBy}</figcaption>
      </figure>
    </Slide>
  );
}

function Method() {
  return (
    <Slide n={METHOD.n} label={METHOD.label} heading={METHOD.heading}>
      <ol className="grid gap-3 md:grid-cols-5">
        {METHOD.steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-2xl bg-light/80 p-5 md:flex-col md:gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral font-sans text-base font-bold text-white">{i + 1}</span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-coral">{step.when}</p>
              <h3 className="mt-1 font-sans text-xl font-bold text-dark">{step.title}</h3>
              <p className="mt-1.5 font-sans text-[15px] leading-snug text-gray-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Slide>
  );
}

function Builds() {
  return (
    <Slide n={BUILDS.n} label={BUILDS.label} heading={BUILDS.heading} tint>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
        {BUILDS.items.map((item) => (
          <div key={item.title} className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-dark/[0.07] md:flex-col md:gap-0 md:p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral">
              <Icon name={item.icon} />
            </span>
            <div>
              <h3 className="font-sans text-lg font-bold text-dark md:mt-4 md:text-xl">{item.title}</h3>
              <p className="mt-1 font-sans text-[15px] leading-snug text-gray-600 md:text-base">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

// One icon per person on the old desk; the ones still needed are filled.
function PeopleGrid({ before, after }: { before: number; after: number }) {
  return (
    <div className="grid grid-cols-5 gap-2 md:gap-3" role="img" aria-label={`${before} people became ${after}`}>
      {Array.from({ length: before }, (_, i) => {
        const kept = i < after;
        return (
          <span key={i} className={`flex aspect-square items-center justify-center rounded-xl ${kept ? "bg-coral text-white" : "bg-white/[0.07] text-white/25"}`}>
            <Icon name="person" size={24} />
          </span>
        );
      })}
    </div>
  );
}

function Results() {
  const f = RESULTS.featured;
  return (
    <Slide n={RESULTS.n} label={RESULTS.label} heading={RESULTS.heading}>
      <div className="grid gap-8 rounded-3xl bg-dark p-6 text-white md:grid-cols-2 md:items-center md:gap-14 md:p-12">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#FF9E82]">{f.sector}</p>
          <p className="mt-4 font-sans font-extrabold leading-none tracking-[-0.03em]" style={{ fontSize: "clamp(3.6rem, 10vw, 6rem)" }}>
            {f.teamBefore} <span className="text-[#FF9E82]">→ {f.teamAfter}</span>
          </p>
          <p className="mt-3 font-sans text-lg text-white/75">{f.caption}</p>
          <dl className="mt-8">
            {f.rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-6 border-t border-white/15 py-3.5">
                <dt className="font-sans text-base text-white/70">{row.label}</dt>
                <dd className="font-sans text-xl font-bold">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <PeopleGrid before={f.teamBefore} after={f.teamAfter} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 md:gap-4">
        {RESULTS.cases.map((c) => (
          <article key={c.sector} className="rounded-2xl p-5 ring-1 ring-dark/10 md:p-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-coral">{c.sector}</p>
            <dl className="mt-4 space-y-3">
              <div className="flex gap-3">
                <dt className="w-14 shrink-0 font-sans text-sm font-semibold text-muted">Before</dt>
                <dd className="font-sans text-base leading-snug text-gray-600">{c.before}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-14 shrink-0 font-sans text-sm font-semibold text-coral">After</dt>
                <dd className="font-sans text-base font-semibold leading-snug text-dark">{c.after}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 md:mt-14">
        <BookCallButton source="results" className={CTA_CLASS} />
        <p className="font-sans text-base text-gray-600">{RESULTS.cta}</p>
      </div>
      <div id="proof-end" aria-hidden="true" />
    </Slide>
  );
}

function People() {
  return (
    <Slide n={PEOPLE.n} label={PEOPLE.label} heading={PEOPLE.heading} tint>
      <div className="grid gap-3 md:grid-cols-3 md:gap-4">
        {PEOPLE.items.map((item, i) => (
          <div key={item.title} className="rounded-2xl bg-white p-6 ring-1 ring-dark/[0.07] md:p-8">
            <p className="ai-lining font-serif text-4xl text-coral">{`0${i + 1}`}</p>
            <h3 className="mt-3 font-sans text-xl font-bold leading-snug text-dark">{item.title}</h3>
            <p className="mt-2 font-sans text-base leading-snug text-gray-600">{item.body}</p>
          </div>
        ))}
      </div>
    </Slide>
  );
}

function Aftercare() {
  return (
    <Slide n={AFTERCARE.n} label={AFTERCARE.label} heading={AFTERCARE.heading}>
      <div className="grid gap-10 md:grid-cols-[1fr_0.9fr] md:items-center md:gap-14">
        <div>
          <p className="max-w-[520px] font-sans text-lg leading-snug text-dark md:text-xl">{AFTERCARE.body}</p>
          <div className="mt-8 grid gap-4">
            {AFTERCARE.points.map((p) => (
              <div key={p.title} className="border-l-2 border-coral pl-4">
                <h3 className="font-sans text-lg font-bold text-dark">{p.title}</h3>
                <p className="font-sans text-base text-gray-600">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
        <figure className="mx-auto w-full max-w-[380px]">
          <div className="rounded-[2rem] bg-dark p-2.5 shadow-[0_24px_60px_-24px_rgba(13,13,13,0.5)]">
            <div className="rounded-[1.6rem] bg-[#ECE5DD] px-4 pb-6 pt-4">
              <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#075E54] px-3.5 py-2.5 text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 font-mono text-[11px] font-bold">AI</span>
                <span className="font-sans text-sm font-semibold">Business assistant</span>
              </div>
              <div className="space-y-2.5">
                {AFTERCARE.chat.map((m) => (
                  <p
                    key={m.text}
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 font-sans text-[15px] leading-snug text-dark shadow-[0_1px_0_rgba(0,0,0,0.12)] ${
                      m.from === "owner" ? "ml-auto rounded-tr-none bg-[#DCF8C6]" : "rounded-tl-none bg-white"
                    }`}
                  >
                    {m.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <figcaption className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{AFTERCARE.chatLabel}</figcaption>
        </figure>
      </div>
    </Slide>
  );
}

function Founders() {
  return (
    <Slide n={FOUNDERS.n} label={FOUNDERS.label} heading={FOUNDERS.heading} tint>
      <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start md:gap-14">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {FOUNDERS.people.map((p) => (
            <figure key={p.name}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-dark/5">
                <Image src={p.photo} alt={p.name} fill sizes="(min-width: 768px) 240px, 45vw" className="object-cover object-top" />
              </div>
              <figcaption className="mt-3">
                <p className="font-sans text-base font-bold text-dark md:text-lg">{p.name}</p>
                <p className="font-sans text-sm text-gray-600">{p.role}</p>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-coral">{p.detail}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <div>
          <p className="font-sans text-lg leading-snug text-dark md:text-xl">{FOUNDERS.body}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {FOUNDERS.promises.map((p) => (
              <div key={p.title} className="rounded-2xl bg-white p-5 ring-1 ring-dark/[0.07]">
                <h3 className="flex items-center gap-2 font-sans text-lg font-bold text-dark">
                  <span className="text-coral" aria-hidden="true">✓</span>
                  {p.title}
                </h3>
                <p className="mt-1 font-sans text-[15px] leading-snug text-gray-600">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Slide>
  );
}

function Faq() {
  return (
    <section className="ai-faq mx-auto max-w-[820px] px-5 py-16 md:px-12 md:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-coral">Questions</p>
      <div className="mt-6 border-b border-dark/10">
        {FAQS.map((faq) => (
          <details key={faq.question} className="border-t border-dark/10">
            <summary className="flex items-center justify-between gap-6 py-5 font-sans text-lg font-semibold text-dark md:text-xl">
              {faq.question}
              <span className="ai-faq-mark shrink-0 font-sans text-2xl text-coral transition-transform duration-300" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="pb-6 pr-10 font-sans text-base leading-relaxed text-gray-600 md:text-lg">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Close() {
  return (
    <section className="bg-dark text-white">
      <div className="mx-auto max-w-[1100px] px-5 pb-32 pt-16 md:px-12 md:py-24">
        <h2 className="ai-lining max-w-[760px] font-serif leading-[1.08]" style={{ fontSize: "clamp(2.2rem, 5.6vw, 4.2rem)" }}>
          {CLOSE.heading}
        </h2>
        <p className="mt-5 font-sans text-lg text-white/75 md:text-xl">{CLOSE.body}</p>
        <div className="mt-9">
          <BookCallButton source="close" className="!bg-coral !text-white hover:!bg-white hover:!text-dark !text-lg !px-9 !py-[1.15rem]" />
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
        <Hero />
        <Slide n={BEFORE.n} label={BEFORE.label} heading={BEFORE.heading} tint>
          <Flow steps={BEFORE.steps} close={BEFORE.close} />
        </Slide>
        <Measured />
        <Slide n={AFTER.n} label={AFTER.label} heading={AFTER.heading} tint>
          <Flow steps={AFTER.steps} close={AFTER.close} />
        </Slide>
        <Method />
        <Builds />
        <Results />
        <People />
        <Aftercare />
        <Founders />
        <LogoTicker only={CAMPAIGN_LOGOS} label={`// ${CLIENTS_LABEL.toLowerCase()}`} />
        <Faq />
        <Close />
      </main>
      <StickyBookCall />
    </AdTracking>
  );
}
