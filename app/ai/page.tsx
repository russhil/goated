import type { Metadata } from "next";
import Image from "next/image";
import LogoTicker from "@/components/LogoTicker";
import AdTracking from "@/components/ai/AdTracking";
import BookCallButton, { StickyBookCall } from "@/components/ai/BookCallButton";
import FounderVideo from "@/components/ai/FounderVideo";
import CaseScroller from "@/components/ai/CaseScroller";
import { CASES_INTRO, CLOSE, HERO, PATH, PROBLEM, TRUST, resolveVariant } from "@/lib/ai/content";
import "./ai.css";

const CAMPAIGN_LOGOS = ["NBA", "KPMG", "Everest Fleet", "Kiko Live", "DlaN5", "Wear World Peace", "Partner"];

// Paid-traffic landing page. One argument, top to bottom, carried by the
// headlines: problem, three real cases wiping in on scroll, path, trust,
// action. No navigation and
// no outbound links; the only exit is the booking form.

export const metadata: Metadata = {
  title: "Grow without hiring more people",
  description: HERO.subhead,
  alternates: { canonical: "https://goatedd.tech/ai" },
  robots: { index: false, follow: false },
};

const CTA_CLASS = "!bg-coral !text-white hover:!bg-dark !text-lg !px-9 !py-[1.15rem]";
const H2 = "ai-lining font-sans font-extrabold leading-[1.05] tracking-[-0.025em]";
const H2_SIZE = { fontSize: "clamp(2.1rem, 5vw, 3.6rem)" };

function Facts({ items, dark = false }: { items: string[]; dark?: boolean }) {
  return (
    <p className={`font-sans text-base ${dark ? "text-white/70" : "text-gray-600"}`}>
      {items.join("  ·  ")}
    </p>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-[1100px] px-5 pb-16 pt-6 md:px-12 md:pb-28 md:pt-8">
      <p className="font-mono text-sm tracking-tight">
        [<span className="font-bold">GOATED</span>
        <span className="font-bold text-coral">.</span>]
      </p>
      <div className="mt-10 grid items-center gap-10 md:mt-16 md:grid-cols-[1.1fr_1fr] md:gap-12">
        <div>
          <h1 className="font-sans font-extrabold leading-[1.02] tracking-[-0.03em] text-dark" style={{ fontSize: "clamp(2.6rem, 5.6vw, 4.3rem)" }}>
            {HERO.headline}
          </h1>
          <p className="mt-5 font-sans text-xl leading-snug text-gray-600 md:text-2xl">{HERO.subhead}</p>
          <div id="hero-cta" className="mt-8 flex flex-col gap-3">
            <BookCallButton source="hero" className={`${CTA_CLASS} sm:self-start`} />
            <Facts items={HERO.facts} />
          </div>
        </div>
        <FounderVideo />
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="bg-light/70">
      <div className="mx-auto max-w-[1100px] px-5 py-20 md:px-12 md:py-28">
        <h2 className={`${H2} max-w-[760px] text-dark`} style={H2_SIZE}>
          {PROBLEM.headline}
        </h2>
        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 md:mt-14 md:grid-cols-3">
          {PROBLEM.work.map((w) => (
            <li key={w} className="border-t-2 border-dark pt-3 font-sans text-xl font-semibold text-dark md:text-2xl">
              {w}
            </li>
          ))}
        </ul>
        <p className="mt-10 font-sans text-xl text-gray-600 md:text-2xl">{PROBLEM.line}</p>
      </div>
    </section>
  );
}

function Cases() {
  return (
    <section>
      <div className="mx-auto max-w-[1100px] px-5 pb-12 pt-20 md:px-12 md:pb-16 md:pt-28">
        <h2 className={`${H2} max-w-[760px] text-dark`} style={H2_SIZE}>
          {CASES_INTRO.headline}
        </h2>
      </div>
      <CaseScroller />
      <div id="proof-end" aria-hidden="true" />
    </section>
  );
}

function Path() {
  return (
    <section className="mx-auto max-w-[1100px] px-5 py-20 md:px-12 md:py-28">
      <h2 className={`${H2} max-w-[760px] text-dark`} style={H2_SIZE}>
        {PATH.headline}
      </h2>
      <ol className="mt-12 grid gap-8 md:mt-16 md:grid-cols-3 md:gap-10">
        {PATH.steps.map((step, i) => (
          <li key={step.title}>
            <p className="ai-lining font-sans text-5xl font-extrabold text-coral">{i + 1}</p>
            <h3 className="mt-3 font-sans text-2xl font-bold text-dark">{step.title}</h3>
            <p className="mt-1 font-sans text-lg text-gray-600">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Trust() {
  return (
    <section className="bg-light/70">
      <div className="mx-auto max-w-[1100px] px-5 pt-20 md:px-12 md:pt-28">
        <h2 className={`${H2} max-w-[760px] text-dark`} style={H2_SIZE}>
          {TRUST.headline}
        </h2>
        <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-[1fr_1fr] md:items-end md:gap-16">
          <div className="grid grid-cols-2 gap-4">
            {TRUST.people.map((p) => (
              <figure key={p.name}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-dark/5">
                  <Image src={p.photo} alt={p.name} fill sizes="(min-width: 768px) 260px, 45vw" className="object-cover object-top" />
                </div>
                <figcaption className="mt-3">
                  <p className="font-sans text-lg font-bold text-dark">{p.name}</p>
                  <p className="font-sans text-sm text-gray-600">{p.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <ul className="space-y-4">
            {TRUST.promises.map((p) => (
              <li key={p} className="flex gap-3 font-sans text-xl font-semibold leading-snug text-dark md:text-2xl">
                <span className="text-coral" aria-hidden="true">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-16 md:mt-24">
        <LogoTicker only={CAMPAIGN_LOGOS} label={`// ${TRUST.clientsLabel.toLowerCase()}`} />
      </div>
    </section>
  );
}

function Close() {
  return (
    <section className="bg-dark text-white">
      <div className="mx-auto max-w-[1100px] px-5 pb-32 pt-20 md:px-12 md:py-28">
        <h2 className={`${H2} max-w-[760px]`} style={H2_SIZE}>
          {CLOSE.headline}
        </h2>
        <div className="mt-9 flex flex-col gap-3">
          <BookCallButton source="close" className="!bg-coral !text-white hover:!bg-white hover:!text-dark !text-lg !px-9 !py-[1.15rem] sm:self-start" />
          <Facts items={CLOSE.facts} dark />
        </div>
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
        <Problem />
        <Cases />
        <Path />
        <Trust />
        <Close />
      </main>
      <StickyBookCall />
    </AdTracking>
  );
}
