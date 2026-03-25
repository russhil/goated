"use client";

import { useEffect, useRef, useState } from "react";

export default function ContactFooter() {
  const sectionRef = useRef<HTMLElement>(null);
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const reveals = el.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    reveals.forEach((r) => observer.observe(r));
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormState({ name: "", email: "", message: "" });
  };

  const handleNavClick = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section ref={sectionRef} id="contact" className="py-20 md:py-32">
      {/* CTA heading */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 text-center mb-20">
        <h2
          className="font-serif text-dark leading-[1.15] reveal"
          style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)" }}
        >
          Ready to be unstoppable?
        </h2>
      </div>

      {/* Contact form */}
      <div className="max-w-[600px] mx-auto px-6 md:px-12 mb-32 reveal">
        {submitted ? (
          <div className="text-center py-12">
            <p className="font-serif text-2xl text-dark mb-2">Thank you.</p>
            <p className="font-sans text-muted">We&apos;ll be in touch soon.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6" role="form" aria-label="Contact form">
            <div>
              <input
                type="text"
                placeholder="Your name"
                className="form-input"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Your email"
                className="form-input"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
              />
            </div>
            <div>
              <textarea
                rows={4}
                placeholder="Tell us what you're building"
                className="form-input resize-none"
                value={formState.message}
                onChange={(e) => setFormState({ ...formState, message: e.target.value })}
              />
            </div>
            <button
              onClick={handleSubmit}
              className="w-full md:w-auto self-start px-8 py-4 bg-dark text-white font-sans text-sm font-medium
                         hover:bg-coral transition-colors duration-300"
            >
              Let&apos;s Build →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-dark/10 pt-12 pb-8 max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-12">
          {/* Logo */}
          <div className="font-mono text-sm tracking-tight">
            <span className="text-dark">[</span>
            <span className="text-dark font-bold">GOATED</span>
            <span className="text-coral font-bold">.</span>
            <span className="text-dark">]</span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-6 md:justify-center">
            {["Home", "Portfolio", "Contact"].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase() === "home" ? "hero" : label.toLowerCase()}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(`#${label.toLowerCase() === "home" ? "hero" : label.toLowerCase()}`);
                }}
                className="font-sans text-sm text-muted hover:text-dark transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Location & email */}
          <div className="md:text-right">
            <p className="font-sans text-sm text-muted">Mumbai, India</p>
            <a
              href="mailto:hello@goated.dev"
              className="font-sans text-sm text-muted hover:text-coral transition-colors"
            >
              hello@goated.dev
            </a>
          </div>
        </div>

        <div className="text-center">
          <p className="font-sans text-xs text-muted/50">
            © 2026 GOATED. All rights reserved.
          </p>
        </div>
      </footer>
    </section>
  );
}
