"use client";

import { useEffect, useState } from "react";

export default function HeroQuote() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setVisible(true));
    } else {
      const timer = setTimeout(() => setVisible(true), 150);
      return () => clearTimeout(timer);
    }
  }, []);

  const quote1 = "The businesses that automate today";
  const quote2 = "are the ones that dominate tomorrow.";
  const words1 = quote1.split(" ");
  const words2 = quote2.split(" ");

  return (
    <section
      id="hero"
      className="pt-40 pb-16 md:pt-48 md:pb-24 flex items-center justify-center px-6 md:px-12"
    >
      <div className="max-w-[900px] text-center">
        <blockquote className="relative">
          {/* Opening quote mark */}
          <span
            className="absolute -top-8 -left-4 md:-top-12 md:-left-8 text-coral font-serif text-7xl md:text-9xl leading-none select-none opacity-80"
            aria-hidden="true"
          >
            &ldquo;
          </span>

          <p
            className="font-serif text-dark leading-[1.2]"
            style={{ fontSize: "clamp(2rem, 5vw, 4.5rem)" }}
          >
            {/* First line - roman */}
            {words1.map((word, i) => (
              <span
                key={`w1-${i}`}
                className="word-animate inline-block mr-[0.3em]"
                style={{
                  animationDelay: visible ? `${i * 80}ms` : "0ms",
                  animationPlayState: visible ? "running" : "paused",
                }}
              >
                {word}
              </span>
            ))}
            <br className="hidden md:block" />
            {/* Second line - italic */}
            {words2.map((word, i) => (
              <span
                key={`w2-${i}`}
                className="word-animate inline-block mr-[0.3em] italic"
                style={{
                  animationDelay: visible ? `${(words1.length + i) * 80}ms` : "0ms",
                  animationPlayState: visible ? "running" : "paused",
                }}
              >
                {word}
              </span>
            ))}
          </p>

          {/* Closing quote mark */}
          <span
            className="absolute -bottom-8 -right-4 md:-bottom-12 md:-right-8 text-coral font-serif text-7xl md:text-9xl leading-none select-none opacity-80"
            aria-hidden="true"
          >
            &rdquo;
          </span>
        </blockquote>

        <h1
          className="mt-12 text-center font-sans tracking-[0.2em] uppercase text-muted text-xs md:text-sm word-animate"
          style={{
            animationDelay: visible ? `${(words1.length + words2.length) * 80 + 200}ms` : "0ms",
            animationPlayState: visible ? "running" : "paused",
          }}
        >
          Custom Software Development &amp; AI Automation Agency | Mumbai, India
        </h1>
      </div>
    </section>
  );
}
