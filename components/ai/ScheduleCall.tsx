"use client";

import { useEffect, useState } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { CAL_LINK } from "@/lib/booking";

// The calendar is an offer, not a gate: the lead is already captured, so this
// only opens when the visitor asks for it.
const NAMESPACE = "thankyou-call";

export default function ScheduleCall() {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<Record<string, string>>({});

  // The site form leaves its answers here so the calendar arrives filled in,
  // without personal data travelling in the URL.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("goated_cal_prefill");
      if (raw) setPrefill(JSON.parse(raw) as Record<string, string>);
    } catch {
      // Nothing stored: the visitor types the details into the calendar.
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const cal = await getCalApi({ namespace: NAMESPACE });
      cal("ui", {
        theme: "light",
        cssVarsPerTheme: { light: { "cal-brand": "#E8533A" }, dark: { "cal-brand": "#E8533A" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-coral px-8 py-4 font-sans text-base font-medium text-white transition-colors duration-300 hover:bg-dark sm:w-auto"
      >
        Schedule a call now
        <span aria-hidden="true">→</span>
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-dark/10">
      <Cal namespace={NAMESPACE} calLink={CAL_LINK} style={{ width: "100%", height: "640px", overflow: "scroll" }} config={{ layout: "month_view", theme: "light", ...prefill }} />
    </div>
  );
}
