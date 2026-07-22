"use client";

import { useEffect, useState } from "react";

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const h = Math.floor(s / 3600);
  if (h < 24) return `${h}h ${Math.floor((s % 3600) / 60)}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

// Live per-card follow-up countdown. Renders a stable "…" until mounted so the
// SSR markup and the first client render match (no hydration mismatch from
// Date.now()), then ticks every second.
export default function FollowupCountdown({ at }: { at: string | null }) {
  const target = at ? new Date(at).getTime() : NaN;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (Number.isNaN(target)) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (Number.isNaN(target)) return null;
  if (now === null) return <span className="font-mono text-[10px] text-muted">…</span>;

  const remaining = target - now;
  if (remaining <= 0) {
    return <span className="font-mono text-[10px] text-coral">⏰ follow up now</span>;
  }
  return (
    <span className="font-mono text-[10px] text-muted">follows up in {fmt(remaining)}</span>
  );
}
