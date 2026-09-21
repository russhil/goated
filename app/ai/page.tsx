import type { Metadata } from "next";
import Image from "next/image";
import LogoTicker from "@/components/LogoTicker";
import AdTracking from "@/components/ai/AdTracking";
import BookCallButton, { StickyBookCall } from "@/components/ai/BookCallButton";
import FounderVideo from "@/components/ai/FounderVideo";
import {
  CLIENTS_LABEL,
  CLOSE,
  FOUNDERS,
  HERO,
  JOBS,
  PROOF,
  STEPS,
  TRUST,
  resolveVariant,
} from "@/lib/ai/content";
import "./ai.css";

const CAMPAIGN_LOGOS = ["NBA", "KPMG", "Everest Fleet", "Kiko Live", "DlaN5", "Wear World Peace", "Partner"];

// Paid-traffic landing page. No navigation and no outbound links: the only
// exit is the booking form. Built to be understood in one scroll by an owner
// who reads English as a second language.

export const metadata: Metadata = {
  title: "Free AI consulting for Indian businesses",
  description: HERO.headline,
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

function Label({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <p className={`font-mono text-xs uppercase tracking-[0.14em] ${dark ? "text-[#FF9E82]" : "text-coral"}`}>{children}</p>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-[1100px] px-5 pb-14 pt-6 md:px-12 md:pb-24 md:pt-8">
      <Brand />
      <div className="mt-8 grid items-center gap-8 md:mt-14 md:grid-cols-[1fr_1.1fr] md:gap-14">
        <div>
          <p className="inline-block rounded-full bg-coral/10 px-3.5 py-2 font-sans text-[13px] font-semibold text-coral md:text-sm">
            {HERO.eyebrow}
          </p>
          <h1 className="ai-lining mt-5 font-sans font-extrabold leading-[1.02] tracking-[-0.03em] text-dark" style={{ fontSize: "clamp(2.4rem, 6.2vw, 4.4rem)" }}>
            {HERO.headline}
          </h1>
          <p className="mt-5 font-sans text-lg text-gray-600 md:text-xl">{HERO.subhead}</p>
        </div>
        <FounderVideo />
      </div>

      <div id="hero-cta" className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 md:mt-12">
        <BookCallButton source="hero" className="!bg-coral !text-white hover:!bg-dark !text-lg !px-9 !py-[1.15rem]" />
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

function Founders() {
  return (
    <section className="border-y border-[#F0F0F0] bg-light/60">
      <div className="mx-auto grid max-w-[1100px] gap-10 px-5 py-14 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-14 md:px-12 md:py-24">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {FOUNDERS.people.map((p) => (
            <figure key={p.name}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-dark/5">
                <Image src={p.photo} alt={p.name} fill sizes="(min-width: 768px) 260px, 45vw" className="object-cover object-top" />
              </div>
              <figcaption className="mt-3">
                <p className="font-sans text-base font-bold text-dark md:text-lg">{p.name}</p>
                <p className="font-sans text-sm text-gray-600">{p.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <div>
          <Label>{FOUNDERS.label}</Label>
          <h2 className="mt-4 font-serif leading-[1.1] text-dark" style={{ fontSize: "clamp(2rem, 4.4vw, 3.2rem)" }}>
            {FOUNDERS.heading}
          </h2>
          <ul className="mt-6 space-y-3">
            {FOUNDERS.lines.map((line) => (
              <li key={line} className="flex gap-3 font-sans text-lg leading-snug text-dark md:text-xl">
                <span className="mt-[0.1em] text-coral" aria-hidden="true">✓</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// Line icons, 24px grid, drawn with the current text colour.
const ICONS: Record<string, React.ReactNode> = {
  keyboard: <><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></>,
  rupee: <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a5 5 0 0 0 0-10" />,
  chart: <path d="M3 3v18h18M7 16v-4M12 16V8M17 16v-7" />,
  chat: <path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-6.2A8 8 0 1 1 21 12z" />,
  box: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>,
};

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

function Jobs() {
  return (
    <section className="mx-auto max-w-[1100px] px-5 py-14 md:px-12 md:py-24">
      <Label>{JOBS.label}</Label>
      <h2 className="mt-4 max-w-[760px] font-serif leading-[1.1] text-dark" style={{ fontSize: "clamp(2rem, 4.4vw, 3.2rem)" }}>
        {JOBS.heading}
      </h2>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {JOBS.items.map((job) => (
          <div key={job.title} className="rounded-2xl border border-dark/10 p-5 md:p-7">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-coral/10 text-coral">
              <Icon name={job.icon} />
            </span>
            <h3 className="mt-4 font-sans text-lg font-bold text-dark md:text-xl">{job.title}</h3>
            <p className="mt-1 font-sans text-[15px] leading-snug text-gray-600 md:text-base">{job.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Proof() {
  return (
    <section className="bg-dark text-white">
      <div className="mx-auto grid max-w-[1100px] gap-10 px-5 py-14 md:grid-cols-2 md:items-end md:px-12 md:py-24">
        <div>
          <Label dark>{PROOF.label}</Label>
          <h2 className="mt-4 font-serif leading-[1.05]" style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)" }}>
            {PROOF.heading}
          </h2>
        </div>
        <dl>
          {PROOF.rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-6 border-t border-white/20 py-5">
              <dt className="font-sans text-base text-white/70 md:text-lg">{row.label}</dt>
              <dd className="ai-lining font-sans text-4xl font-extrabold tracking-[-0.02em] text-[#FF9E82] md:text-5xl">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div id="proof-end" aria-hidden="true" />
    </section>
  );
}

function Steps() {
  return (
    <section className="mx-auto max-w-[1100px] px-5 py-14 md:px-12 md:py-24">
      <Label>{STEPS.label}</Label>
      <ol className="mt-8 grid gap-3 md:grid-cols-3 md:gap-4">
        {STEPS.items.map((step) => (
          <li key={step.n} className="flex gap-4 rounded-2xl bg-light/70 p-5 md:flex-col md:p-7">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral font-sans text-lg font-bold text-white">
              {step.n}
            </span>
            <div>
              <h3 className="font-sans text-xl font-bold text-dark">{step.title}</h3>
              <p className="mt-1 font-sans text-base leading-snug text-gray-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Trust() {
  return (
    <section className="border-t border-[#F0F0F0]">
      <div className="mx-auto max-w-[1100px] px-5 py-14 md:px-12 md:py-20">
        <Label>{TRUST.label}</Label>
        <div className="mt-8 grid gap-6 md:grid-cols-3 md:gap-12">
          {TRUST.items.map((item) => (
            <div key={item.title} className="border-l-2 border-coral pl-4">
              <h3 className="font-sans text-xl font-bold text-dark">{item.title}</h3>
              <p className="mt-1 font-sans text-base leading-snug text-gray-600">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Close() {
  return (
    <section className="bg-dark text-white">
      <div className="mx-auto max-w-[1100px] px-5 pb-32 pt-16 md:px-12 md:py-24">
        <h2 className="max-w-[760px] font-serif leading-[1.08]" style={{ fontSize: "clamp(2.2rem, 5.6vw, 4.2rem)" }}>
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
        <Founders />
        <Jobs />
        <Proof />
        <Steps />
        <Trust />
        <LogoTicker only={CAMPAIGN_LOGOS} label={`// ${CLIENTS_LABEL.toLowerCase()}`} />
        <Close />
      </main>
      <StickyBookCall />
    </AdTracking>
  );
}
