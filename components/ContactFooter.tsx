"use client";

import { useRef, useState } from "react";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

export default function ContactFooter() {
  const sectionRef = useRef<HTMLElement>(null);
  const [formState, setFormState] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useRevealOnScroll(sectionRef);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("https://formspree.io/f/xnjoppzr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(formState)
      });
      
      if (response.ok) {
        setSubmitted(true);
        setFormState({ name: "", email: "", message: "" });
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        alert("Something went wrong. Please try again or email us directly at hello@goatedd.tech");
      }
    } catch (error) {
      console.error("Error submitting form", error);
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavClick = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section ref={sectionRef} id="contact" className="py-20 md:py-32">
      {/* Contact Section */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-32 reveal">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-12 md:gap-16 items-center">
          
          {/* Left Column: Form & Heading */}
          <div className="flex flex-col gap-10">
            <h2
              className="font-serif text-dark leading-[1.15]"
              style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)" }}
            >
              Ready to be unstoppable?
            </h2>

            {/* Contact form */}
            <div className="w-full">
              {submitted ? (
                <div className="py-12">
                  <p className="font-serif text-2xl text-dark mb-2">Thank you.</p>
                  <p className="font-sans text-muted">We&apos;ll be in touch soon.</p>
                </div>
              ) : (
                <form className="flex flex-col gap-6" aria-label="Contact form" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="name" className="sr-only">Your name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Your name"
                      className="form-input"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="sr-only">Your email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="Your email"
                      className="form-input"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="sr-only">Tell us what you're building</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      placeholder="Tell us what you're building"
                      className="form-input resize-none"
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto self-start px-8 py-4 bg-dark text-white font-sans text-sm font-medium
                               rounded-full hover:bg-coral transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Sending..." : "Let's Build →"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Middle Column: Vertical Divider */}
          <div className="hidden md:block w-px h-[80%] bg-gray-200"></div>
          {/* Mobile Divider */}
          <div className="md:hidden w-full h-px bg-gray-200"></div>

          {/* Right Column: Email Button */}
          <div className="flex flex-col gap-6 h-full justify-center pl-0 md:pl-8">
            <div>
              <p className="text-xl font-serif text-dark mb-2">Prefer email?</p>
              <p className="font-sans text-muted text-base">
                Drop us a line directly and we'll get back to you within 24 hours.
              </p>
            </div>
            <a
              href="mailto:hello@goatedd.tech"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-200 hover:border-coral hover:bg-coral hover:text-white rounded-full transition-all duration-300 font-sans text-lg font-medium text-dark group w-fit"
            >
              hello@goatedd.tech
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#F0F0F0] pt-12 pb-8 max-w-[1400px] mx-auto px-6 md:px-12">
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
            {["Home", "Portfolio", "Contact"].map((label) => {
              const href = label === "Home" ? "/#hero" : label === "Portfolio" ? "/portfolio" : "/#contact";
              return (
              <a
                key={label}
                href={href}
                onClick={(e) => {
                  if (label !== "Portfolio") {
                     e.preventDefault();
                     handleNavClick(href.replace('/', ''));
                  }
                }}
                className="font-sans text-sm text-muted hover:text-dark transition-colors"
              >
                {label}
              </a>
            )})}
          </div>

          {/* Location & email */}
          <div className="md:text-right">
            <p className="font-sans text-sm text-muted">Mumbai, India</p>
            <a
              href="mailto:hello@goatedd.tech"
              className="font-sans text-sm text-muted hover:text-coral transition-colors"
            >
              hello@goatedd.tech
            </a>
          </div>
        </div>

        <div className="text-center">
          <p className="font-sans text-xs text-muted/80">
            © 2026 GOATED. All rights reserved.
          </p>
        </div>
      </footer>
    </section>
  );
}
