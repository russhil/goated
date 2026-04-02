"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

const STATS = [
  { value: 100, suffix: "%", label: "Bespoke builds. No templates.", duration: 1000 },
  { value: 3, suffix: "X", label: "Average efficiency gain for clients.", duration: 800 },
  { value: 0, suffix: "", label: "Zero off-the-shelf solutions. Ever.", duration: 0 },
];

function animateCounter(
  el: HTMLElement,
  target: number,
  suffix: string,
  duration: number
) {
  if (target === 0) {
    el.textContent = "0" + suffix;
    return;
  }
  const start = performance.now();
  const update = (time: number) => {
    const progress = Math.min((time - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(ease * target) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

export default function WhatWeAre() {
  const sectionRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const animateStats = useCallback(() => {
    if (hasAnimated.current || !statsRef.current) return;
    hasAnimated.current = true;
    const statEls = statsRef.current.querySelectorAll<HTMLElement>('[data-stat]');
    statEls.forEach((el, i) => {
      const stat = STATS[i];
      setTimeout(() => {
        if (el.parentElement) {
          el.parentElement.style.opacity = '1';
          el.parentElement.style.transform = 'translateY(0)';
        }
        animateCounter(el, stat.value, stat.suffix, stat.duration);
      }, i * 150);
    });
  }, []);

  useRevealOnScroll(sectionRef);

  useEffect(() => {
    const statsEl = statsRef.current;
    if (!statsEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animateStats();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(statsEl);
    return () => observer.disconnect();
  }, [animateStats]);

  return (
    <section
      ref={sectionRef}
      id="what-we-are"
      className="flex items-center px-6 md:px-16 py-20 md:py-32"
    >
      <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
        {/* Left column - sticky */}
        <div className="lg:sticky lg:top-32 lg:self-start reveal">
          <div className="section-label">// what we do</div>

          <h2
            className="font-serif text-dark leading-tight max-w-md"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
          >
            We make your business unstoppable.
          </h2>

          <p className="text-base text-gray-500 leading-relaxed max-w-sm mt-6">
            We&apos;re a software development agency that builds custom software
            and AI automations from scratch. Internal tools, automated workflows,
            and business process automation. Systems that eliminate the manual work
            killing your team&apos;s time. No templates. Ever.
          </p>
        </div>

        {/* Right column - stats */}
        <div ref={statsRef} className="flex flex-col">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="border-t border-[#EEEEEE] pt-10 pb-10"
              style={{
                opacity: 0,
                transform: 'translateY(24px)',
                transition: 'opacity 600ms ease, transform 600ms ease',
                transitionDelay: `${i * 150}ms`,
              }}
            >
              <div
                data-stat
                className="font-serif text-7xl leading-none text-[#0D0D0D] tracking-tight"
              >
                {stat.value === 0 ? '0' : '0' + stat.suffix}
              </div>
              <p className="font-sans text-sm text-gray-400 mt-2">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
