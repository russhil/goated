"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import posthog from "posthog-js";
import type { HeroVariant } from "@/lib/ai/content";
import LeadModal, { type LeadContext } from "./LeadModal";

// Browser half of the Meta tracking stack for /ai. Each pixel event carries an
// eventID and is mirrored server-side with the same id (see lib/meta/capi.ts).
// Lead = the form is submitted (server event from /api/ai/lead).
// Schedule = the call is booked (server event from the cal.com webhook, which
// receives the ids below as booking metadata).

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
// X (Twitter) pixel. Event ids are created per ad account in X Ads > Events.
const X_PIXEL_ID = process.env.NEXT_PUBLIC_X_PIXEL_ID;
const X_LEAD_EVENT = process.env.NEXT_PUBLIC_X_LEAD_EVENT_ID;
const X_SCHEDULE_EVENT = process.env.NEXT_PUBLIC_X_SCHEDULE_EVENT_ID;
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: unknown;
  loaded: boolean;
  version: string;
};

type Twq = ((...args: unknown[]) => void) & {
  exe?: (...args: unknown[]) => void;
  queue: unknown[];
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
    twq?: Twq;
  }
}

type AdTrackingValue = { openBooking: (source: string) => void; isOpen: boolean };

const AdTrackingContext = createContext<AdTrackingValue | null>(null);

export function useAdTracking() {
  const ctx = useContext(AdTrackingContext);
  if (!ctx) throw new Error("useAdTracking must be used inside <AdTracking>");
  return ctx;
}

function newId(prefix: string) {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${rand}`;
}

function cookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

// _fbc is normally written by the pixel; rebuild it from fbclid when the
// pixel is blocked so the server event still carries the click id.
function readFbc() {
  const existing = cookie("_fbc");
  if (existing) return existing;
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;
}

function loadPixel(pixelId: string) {
  if (window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  fbq("init", pixelId);
}

function loadXPixel(pixelId: string) {
  if (window.twq) return;
  const twq = function (...args: unknown[]) {
    if (twq.exe) twq.exe(...args);
    else twq.queue.push(args);
  } as Twq;
  twq.version = "1.1";
  twq.queue = [];
  window.twq = twq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://static.ads-twitter.com/uwt.js";
  document.head.appendChild(script);
  twq("config", pixelId);
}

export default function AdTracking({
  variant,
  children,
}: {
  variant: HeroVariant;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const leadEventId = useRef("");
  const scheduleEventId = useRef("");

  const mirror = useCallback(
    async (name: "PageView" | "ViewContent", eventId: string) => {
      try {
        const res = await fetch("/api/meta/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            name,
            eventId,
            variant,
            url: window.location.href,
            fbp: cookie("_fbp"),
            fbc: readFbc(),
          }),
        });
        await res.json();
      } catch {
        // Tracking never blocks the page.
      }
    },
    [variant]
  );

  const track = useCallback(
    (name: "PageView" | "ViewContent", delayMs = 0) => {
      const eventId = newId(name.toLowerCase());
      window.fbq?.("track", name, { variant }, { eventID: eventId });
      // A short delay lets the pixel write _fbp before the server mirror reads it.
      window.setTimeout(() => mirror(name, eventId), delayMs);
    },
    [mirror, variant]
  );

  useEffect(() => {
    // Effects run twice under React strict mode; one PageView per load.
    if (leadEventId.current) return;
    leadEventId.current = newId("lead");
    scheduleEventId.current = newId("schedule");
    if (PIXEL_ID) loadPixel(PIXEL_ID);
    if (X_PIXEL_ID) loadXPixel(X_PIXEL_ID);
    track("PageView", 1200);
    posthog.capture("ai_page_viewed", { variant });
  }, [track, variant]);

  // ViewContent: the visitor scrolled past the proof section.
  useEffect(() => {
    const marker = document.getElementById("proof-end");
    if (!marker) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        track("ViewContent");
        posthog.capture("ai_proof_viewed", { variant });
      },
      { threshold: 0 }
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [track, variant]);

  const openBooking = useCallback(
    (source: string) => {
      posthog.capture("booking_cta_clicked", { source, variant, page: "ai" });
      setIsOpen(true);
    },
    [variant]
  );

  const close = useCallback(() => setIsOpen(false), []);

  const getContext = useCallback((): LeadContext => {
    const params = new URLSearchParams(window.location.search);
    const context: LeadContext = {
      eventId: leadEventId.current,
      schedule_event_id: scheduleEventId.current,
      variant,
      url: window.location.href,
      page: window.location.origin + window.location.pathname,
      fbp: cookie("_fbp"),
      fbc: readFbc(),
      ua: navigator.userAgent.slice(0, 480),
    };
    for (const key of UTM_KEYS) context[key] = params.get(key) ?? undefined;
    return context;
  }, [variant]);

  const onLead = useCallback(
    (eventId: string) => {
      window.fbq?.(
        "track",
        "Lead",
        { content_name: "ai-lead-form", variant },
        { eventID: eventId }
      );
      if (X_LEAD_EVENT) window.twq?.("event", X_LEAD_EVENT, { conversion_id: eventId });
      posthog.capture("ai_lead_submitted", { variant });
    },
    [variant]
  );

  const onScheduled = useCallback(() => {
    window.fbq?.(
      "track",
      "Schedule",
      { content_name: "free-30-minute-call", variant },
      { eventID: scheduleEventId.current }
    );
    if (X_SCHEDULE_EVENT) {
      window.twq?.("event", X_SCHEDULE_EVENT, { conversion_id: scheduleEventId.current });
    }
    posthog.capture("ai_booking_completed", { variant });
  }, [variant]);

  const value = useMemo(() => ({ openBooking, isOpen }), [openBooking, isOpen]);

  return (
    <AdTrackingContext.Provider value={value}>
      {children}
      <LeadModal
        isOpen={isOpen}
        onClose={close}
        getContext={getContext}
        onLead={onLead}
        onScheduled={onScheduled}
      />
    </AdTrackingContext.Provider>
  );
}
