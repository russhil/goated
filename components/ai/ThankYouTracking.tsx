"use client";

import { useEffect, useRef } from "react";
import posthog from "posthog-js";

// /thankyou is a real page load, so Meta and X both see a URL change and can
// count it. The lead only reaches this page after submitting a form, which
// makes it the reliable conversion signal for X (its pixel never saw the
// in-page modal). Meta's Lead event already fired on /ai, so this page only
// sends a PageView to Meta and the lead event to X.

type Pixel = ((...a: unknown[]) => void) | undefined;

const META_PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const X_PIXEL = process.env.NEXT_PUBLIC_X_PIXEL_ID;
const X_LEAD_EVENT = process.env.NEXT_PUBLIC_X_LEAD_EVENT_ID;

function loadMeta(id: string) {
  if (window.fbq) return;
  const fbq = function (...args: unknown[]) {
    // @ts-expect-error pixel bootstrap shape
    fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args);
  } as unknown as { (...a: unknown[]): void; queue: unknown[]; loaded: boolean; version: string; push: unknown };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.push = fbq;
  window.fbq = fbq as unknown as typeof window.fbq;
  window._fbq = fbq;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  (window.fbq as Pixel)?.("init", id);
}

function loadX(id: string) {
  if (window.twq) return;
  const twq = function (...args: unknown[]) {
    if (twq.exe) twq.exe(...args);
    else twq.queue.push(args);
  } as unknown as { (...a: unknown[]): void; queue: unknown[]; version: string; exe?: (...a: unknown[]) => void };
  twq.version = "1.1";
  twq.queue = [];
  window.twq = twq as unknown as typeof window.twq;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://static.ads-twitter.com/uwt.js";
  document.head.appendChild(s);
  (window.twq as Pixel)?.("config", id);
}

export default function ThankYouTracking() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    if (META_PIXEL) {
      loadMeta(META_PIXEL);
      (window.fbq as Pixel)?.("track", "PageView");
    }
    if (X_PIXEL) loadX(X_PIXEL);
    if (X_LEAD_EVENT) {
      if (X_LEAD_EVENT.startsWith("tw-")) (window.twq as Pixel)?.("event", X_LEAD_EVENT, {});
      else {
        const img = new Image();
        img.src = `https://analytics.twitter.com/i/adsct?txn_id=${encodeURIComponent(X_LEAD_EVENT)}&p_id=Twitter&tw_sale_amount=0&tw_order_quantity=0`;
      }
    }
    posthog.capture("ai_thankyou_viewed", { from: new URLSearchParams(window.location.search).get("from") ?? "unknown" });
  }, []);

  return null;
}
