"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { triggerDueFollowups } from "./actions";

// Invisible page-level watchdog. When the earliest active follow-up timer hits
// zero it fires the reminder server action (which nudges over Telegram + bumps
// the timers), then refreshes so the new timers reflect. A ref guards against
// overlapping calls; a short cooldown keeps it from hammering between refreshes.
//
// This is what makes the timer fire while the page is open (works on any Vercel
// plan). The weekly Vercel Cron is the primary production trigger.
export default function FollowupTicker({ dueTimes }: { dueTimes: string[] }) {
  const router = useRouter();
  const firing = useRef(false);

  const earliest = dueTimes
    .map((t) => new Date(t).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b)[0];

  useEffect(() => {
    if (earliest === undefined) return;

    const check = async () => {
      if (firing.current || Date.now() < earliest) return;
      firing.current = true;
      try {
        await triggerDueFollowups();
        router.refresh(); // resync client props with the bumped server timers
      } finally {
        setTimeout(() => {
          firing.current = false;
        }, 5000);
      }
    };

    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [earliest, router]);

  return null;
}
