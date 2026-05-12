"use client";

import { useState } from "react";
import type { BookingPrefill } from "./BookingProvider";
import posthog from "posthog-js";

type Props = {
  onQualified: (data: BookingPrefill) => void;
};

export default function BookingQualifier({ onQualified }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (businessDescription.trim().length < 20) {
      setError("Tell us a bit more about your business (at least 20 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/booking-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          businessDescription: businessDescription.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Couldn't save your details. Try again?");
        setSubmitting(false);
        return;
      }
      posthog.capture("booking_qualifier_submitted", {
        description_length: businessDescription.trim().length,
      });
      onQualified({
        name: name.trim(),
        email: email.trim(),
        notes: businessDescription.trim(),
      });
    } catch {
      setError("Network error. Try again?");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-6 md:px-10 py-8 md:py-12 overflow-y-auto">
      <p className="font-mono text-xs text-coral uppercase tracking-widest mb-4">
        {"// quick context"}
      </p>
      <h2
        className="font-serif text-dark leading-[1.15] mb-4"
        style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}
      >
        Before we book — <span className="italic text-coral">tell us what you do.</span>
      </h2>
      <p className="font-sans text-muted text-sm md:text-base mb-8 leading-relaxed">
        We work with a handful of clients at a time, so we screen briefly first. One
        question, two contact lines, then the calendar.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="bq-name"
            className="font-mono text-[10px] text-muted uppercase tracking-widest block mb-2"
          >
            // your name
          </label>
          <input
            id="bq-name"
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full px-4 py-3 border border-dark/15 rounded-xl bg-white text-dark text-sm md:text-base font-sans focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20 transition"
          />
        </div>

        <div>
          <label
            htmlFor="bq-email"
            className="font-mono text-[10px] text-muted uppercase tracking-widest block mb-2"
          >
            // work email
          </label>
          <input
            id="bq-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@company.com"
            className="w-full px-4 py-3 border border-dark/15 rounded-xl bg-white text-dark text-sm md:text-base font-sans focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20 transition"
          />
        </div>

        <div>
          <label
            htmlFor="bq-desc"
            className="font-mono text-[10px] text-muted uppercase tracking-widest block mb-2"
          >
            // what does your business do, and what do you need help with?
          </label>
          <textarea
            id="bq-desc"
            required
            minLength={20}
            maxLength={1000}
            rows={4}
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value)}
            placeholder="e.g., We run a 12-person fashion DTC brand in Mumbai. Looking for an automated order-routing system that talks to our 3PL."
            className="w-full px-4 py-3 border border-dark/15 rounded-xl bg-white text-dark text-sm md:text-base font-sans focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20 transition resize-none"
          />
          <p className="font-mono text-[10px] text-muted/70 mt-1">
            {businessDescription.length}/1000
          </p>
        </div>

        {error && (
          <p className="font-mono text-xs text-red-600">{`// ${error}`}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="self-start group relative inline-flex items-center gap-2 px-6 py-3 bg-dark text-white rounded-full font-sans text-sm font-medium hover:bg-coral transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting…" : "Continue to booking"}
          <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </button>
      </form>
    </div>
  );
}
