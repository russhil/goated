"use client";

import { useEffect, useState } from "react";
import { CTA_LABEL } from "@/lib/ai/content";
import { useAdTracking } from "./AdTracking";

type Props = {
  source: string;
  tone?: "dark" | "light";
  className?: string;
};

export default function BookCallButton({ source, tone = "dark", className = "" }: Props) {
  const { openBooking } = useAdTracking();
  const palette =
    tone === "dark"
      ? "bg-dark text-white hover:bg-coral"
      : "bg-white text-dark hover:bg-coral hover:text-white";

  return (
    <button
      type="button"
      onClick={() => openBooking(source)}
      className={`group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full px-7 py-4 font-sans text-base font-medium transition-colors duration-300 ${palette} ${className}`}
    >
      {CTA_LABEL}
      <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
        →
      </span>
    </button>
  );
}

// Mobile-only bar that keeps the single CTA in reach once the hero button
// scrolls out of view.
export function StickyBookCall() {
  const { openBooking, isOpen } = useAdTracking();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const heroCta = document.getElementById("hero-cta");
    if (!heroCta) return;
    const observer = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(heroCta);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!show || isOpen}
      className={`md:hidden fixed inset-x-0 bottom-0 z-[100] border-t border-dark/10 bg-white/95 backdrop-blur px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-300 ${
        show && !isOpen ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <button
        type="button"
        tabIndex={show && !isOpen ? 0 : -1}
        onClick={() => openBooking("sticky_bar")}
        className="w-full rounded-full bg-coral px-6 py-3.5 font-sans text-base font-medium text-white"
      >
        {CTA_LABEL} →
      </button>
    </div>
  );
}
