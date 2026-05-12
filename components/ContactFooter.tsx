"use client";

import { useRef, useState } from "react";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { useBooking } from "./BookingProvider";
import posthog from "posthog-js";

export default function ContactFooter() {
  const sectionRef = useRef<HTMLElement>(null);
  const [formState, setFormState] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { open: openBooking } = useBooking();

  useRevealOnScroll(sectionRef);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.ok) {
        posthog.capture("contact_form_submitted", {
          has_phone: !!formState.phone,
          message_length: formState.message.length,
        });
        setSubmitted(true);
        setFormState({ name: "", email: "", phone: "", message: "" });
        setTimeout(() => setSubmitted(false), 5000);
      } else if (response.status === 429) {
        alert(data?.error || "Too many submissions. Try again in a bit.");
      } else {
        alert(
          data?.error ||
            "Something went wrong. Please try again or email us directly at hello@goatedd.tech"
        );
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
    <section ref={sectionRef} id="contact" className="py-16 md:py-24">
      {/* Contact Section */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-20 reveal">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-12 md:gap-16 items-center">

          {/* Left Column: Booking + Form & Heading */}
          <div className="flex flex-col gap-8">
            <h2
              className="font-serif text-dark leading-[1.15]"
              style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)" }}
            >
              Ready to be unstoppable?
            </h2>

            {/* Primary booking CTA */}
            <div className="flex flex-col gap-8">
              <button
                onClick={() => { posthog.capture("booking_cta_clicked", { source: "contact_footer" }); openBooking(); }}
                className="group relative inline-flex items-center gap-2 px-7 py-4 bg-coral text-white font-sans text-base font-medium rounded-full hover:shadow-[0_10px_32px_rgba(232,83,58,0.4)] hover:-translate-y-0.5 transition-all duration-300 w-fit"
              >
                <span className="absolute inset-0 rounded-full bg-coral/40 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 -z-10 blur-lg" />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:rotate-6">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Book a call with us
                <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">→</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted/60">or send a message</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

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
                    <label htmlFor="phone" className="sr-only">Your phone number</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="Your phone number"
                      className="form-input"
                      value={formState.phone}
                      onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="sr-only">Tell us about your business</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      placeholder="Tell us about your business"
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
              onClick={() => posthog.capture("email_cta_clicked", { source: "contact_footer" })}
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
      <footer className="border-t border-dark/10 pt-12 pb-8 max-w-[1400px] mx-auto px-6 md:px-12 sticky bottom-0 z-10 bg-gradient-to-t from-white/95 to-white/60 backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-12">
          {/* Logo */}
          <div className="font-mono text-sm tracking-tight">
            <span className="text-dark">[</span>
            <span className="text-dark font-bold">GOATED</span>
            <span className="text-coral font-bold">.</span>
            <span className="text-dark">]</span>
          </div>

          {/* Nav links */}
          <div className="flex flex-col items-start md:items-center gap-3">
            <div className="flex items-center gap-6">
              {["Home", "Portfolio", "Explore Jobs", "Blogs", "Contact"].map((label) => {
                const href =
                  label === "Home" ? "/#hero"
                  : label === "Portfolio" ? "/portfolio"
                  : label === "Explore Jobs" ? "/explore"
                  : label === "Blogs" ? "/blog"
                  : "/#contact";
                const isRoute = label === "Portfolio" || label === "Explore Jobs" || label === "Blogs";
                return (
                <a
                  key={label}
                  href={href}
                  onClick={(e) => {
                    if (!isRoute) {
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
            <div className="flex items-center gap-6">
              {[
                { label: "What We Do", href: "/#what-we-are" },
                { label: "Industries", href: "/#industries" },
                { label: "FAQ", href: "/#faq" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(href.replace('/', ''));
                  }}
                  className="font-sans text-xs text-muted/70 hover:text-dark transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Location & email */}
          <div className="md:text-right">
            <p className="font-sans text-sm text-muted">Software & AI Agency</p>
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
