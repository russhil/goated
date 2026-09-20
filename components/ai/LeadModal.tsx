"use client";

import { useEffect, useState } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { CAL_LINK } from "@/lib/booking";
import { REVENUE_BANDS, validateLead, type LeadErrors, type LeadInput } from "@/lib/ai/lead";

// Two steps in one modal: the lead form (the campaign's `Lead`), then the
// cal.com calendar prefilled from it (the `Schedule`).

const CAL_NAMESPACE = "ai-call";

export type LeadContext = Record<string, string | undefined>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  // Tracking fields merged into the lead POST and the cal.com metadata.
  getContext: () => LeadContext;
  onLead: (eventId: string, ip: string) => void;
  onScheduled: () => void;
};

const EMPTY: LeadInput = { name: "", email: "", company: "", phone: "", revenueBand: "" };

const inputClass =
  "w-full rounded-xl border border-dark/15 bg-white px-4 py-3 font-sans text-base text-dark transition focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20";
const labelClass = "mb-2 block font-mono text-[10px] uppercase tracking-widest text-muted";

export default function LeadModal({ isOpen, onClose, getContext, onLead, onScheduled }: Props) {
  const [step, setStep] = useState<"form" | "calendar">("form");
  const [input, setInput] = useState<LeadInput>(EMPTY);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [calConfig, setCalConfig] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      cal("ui", {
        theme: "light",
        cssVarsPerTheme: {
          light: { "cal-brand": "#E8533A" },
          dark: { "cal-brand": "#E8533A" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
      cal("on", { action: "bookingSuccessfulV2", callback: () => onScheduled() });
    })();
  }, [onScheduled]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const set = (key: keyof LeadInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setInput((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const found = validateLead(input);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    const context = getContext();
    try {
      const res = await fetch("/api/ai/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, ...context, website: honeypot }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.errors) setErrors(data.errors);
        else setFormError(data.error || "Submission failed: retry.");
        setSubmitting(false);
        return;
      }

      if (!data.repeat) onLead(data.eventId, typeof data.ip === "string" ? data.ip : "");

      const config: Record<string, string> = {
        name: input.name.trim(),
        email: input.email.trim(),
        attendeePhoneNumber: input.phone.trim(),
        notes: `${input.company.trim()} · ${
          REVENUE_BANDS.find((b) => b.value === input.revenueBand)?.label ?? ""
        }`,
      };
      const meta: LeadContext = { ...context, ip: data.ip, lead_event_id: data.eventId };
      delete meta.eventId;
      delete meta.url;
      for (const [key, value] of Object.entries(meta)) {
        if (value) config[`metadata[${key}]`] = value;
      }
      setCalConfig(config);
      setStep("calendar");
    } catch {
      setFormError("Network error: retry.");
    }
    setSubmitting(false);
  };

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[200] flex items-stretch justify-center transition-opacity duration-300 md:items-center ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-dark/70 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Book a call"
        className={`relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 md:mx-6 md:rounded-2xl ${
          step === "calendar" ? "md:h-[88vh] md:max-w-[1100px]" : "md:h-auto md:max-h-[92vh] md:max-w-[560px]"
        } ${isOpen ? "translate-y-0 scale-100" : "translate-y-4 scale-95"}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-dark/10 px-4 py-3 md:px-5">
          <div className="font-mono text-xs tracking-tight md:text-sm">
            <span>[</span>
            <span className="font-bold">GOATED</span>
            <span className="font-bold text-coral">.</span>
            <span>]</span>
            <span className="ml-3 text-muted">{step === "form" ? "1 / 2" : "2 / 2"}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-dark/60 transition hover:bg-dark/5 hover:text-dark"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto">
          {step === "form" && (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 px-6 py-7 md:px-9 md:py-9">
              <div>
                <h2 className="font-serif text-3xl leading-tight text-dark">Book the call</h2>
                <p className="mt-2 font-sans text-sm text-muted">Calendar opens after this form.</p>
              </div>

              <div>
                <label htmlFor="lead-name" className={labelClass}>Name</label>
                <input id="lead-name" type="text" autoComplete="name" value={input.name} onChange={set("name")} className={inputClass} aria-invalid={Boolean(errors.name)} />
                {errors.name && <p className="mt-1.5 font-sans text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="lead-email" className={labelClass}>Work email</label>
                <input id="lead-email" type="email" inputMode="email" autoComplete="email" placeholder="name@company.com" value={input.email} onChange={set("email")} className={inputClass} aria-invalid={Boolean(errors.email)} />
                {errors.email && <p className="mt-1.5 font-sans text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="lead-company" className={labelClass}>Company</label>
                <input id="lead-company" type="text" autoComplete="organization" value={input.company} onChange={set("company")} className={inputClass} aria-invalid={Boolean(errors.company)} />
                {errors.company && <p className="mt-1.5 font-sans text-sm text-red-600">{errors.company}</p>}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="lead-phone" className={labelClass}>Phone</label>
                  <input id="lead-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91" value={input.phone} onChange={set("phone")} className={inputClass} aria-invalid={Boolean(errors.phone)} />
                  {errors.phone && <p className="mt-1.5 font-sans text-sm text-red-600">{errors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="lead-revenue" className={labelClass}>Annual revenue</label>
                  <select id="lead-revenue" value={input.revenueBand} onChange={set("revenueBand")} className={`${inputClass} appearance-none`} aria-invalid={Boolean(errors.revenueBand)}>
                    <option value="" disabled>Select</option>
                    {REVENUE_BANDS.map((band) => (
                      <option key={band.value} value={band.value}>{band.label}</option>
                    ))}
                  </select>
                  {errors.revenueBand && <p className="mt-1.5 font-sans text-sm text-red-600">{errors.revenueBand}</p>}
                </div>
              </div>

              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />

              {formError && <p className="font-sans text-sm text-red-600">{formError}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-dark px-7 py-4 font-sans text-base font-medium text-white transition-colors duration-300 hover:bg-coral disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Saving" : "Continue to calendar"}
                <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </button>
              <a href="/privacy" target="_blank" rel="noopener" className="self-center font-mono text-[10px] uppercase tracking-widest text-muted hover:text-dark">
                Privacy policy
              </a>
            </form>
          )}

          {step === "calendar" && (
            <Cal
              namespace={CAL_NAMESPACE}
              calLink={CAL_LINK}
              style={{ width: "100%", height: "100%", minHeight: "100%" }}
              config={{ layout: "month_view", theme: "light", ...calConfig }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
