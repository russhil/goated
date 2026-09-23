import type { Metadata } from "next";
import ScheduleCall from "@/components/ai/ScheduleCall";
import ThankYouTracking from "@/components/ai/ThankYouTracking";

// Where every lead form lands: the Meta Instant Form's thank-you button and
// the site form both end here. The details are already in; booking a time is
// offered, never forced.

export const metadata: Metadata = {
  title: "Thank you",
  description: "GOATED has your details and will be in touch.",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <main className="mx-auto flex min-h-[100svh] max-w-[720px] flex-col justify-center px-5 py-16 md:px-10">
      <ThankYouTracking />
      <p className="font-mono text-sm tracking-tight">
        [<span className="font-bold">GOATED</span>
        <span className="font-bold text-coral">.</span>]
      </p>

      <span className="mt-10 flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 font-sans text-2xl text-coral" aria-hidden="true">
        ✓
      </span>

      <h1 className="mt-6 font-sans text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-dark md:text-5xl">
        Thank you, we have your details.
      </h1>
      <p className="mt-5 font-sans text-lg leading-snug text-gray-600 md:text-xl">
        A founder will get back to you on WhatsApp, phone or email.
      </p>

      <div className="mt-10 border-t border-dark/10 pt-8">
        <p className="font-sans text-lg font-semibold text-dark md:text-xl">Pick a time yourself</p>
        <p className="mt-1 font-sans text-base text-gray-600">30 minutes with a founder, free.</p>
        <div className="mt-5">
          <ScheduleCall />
        </div>
      </div>

      <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        GOATED<span className="text-coral">.</span> · Mumbai · hello@goatedd.tech
      </p>
    </main>
  );
}
