"use client";

import { useEffect, useRef, useState } from "react";

export type AuditItem = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entity_label: string | null;
  summary: string;
  created_at: string;
};

// email → local part; "telegram:123" → "telegram"; else as-is.
function actorLabel(actor: string): string {
  if (actor.startsWith("telegram")) return "telegram bot";
  const at = actor.indexOf("@");
  return at > 0 ? actor.slice(0, at) : actor;
}

function timeAgo(iso: string, now: number): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const ACTION_COLOR: Record<string, string> = {
  create: "text-emerald-600",
  update: "text-dark/60",
  delete: "text-red-600",
  archive: "text-amber-600",
  restore: "text-emerald-600",
  generate: "text-coral",
  send: "text-coral",
};

// Floating history icon on the right edge; opens a panel listing recent changes.
// Rendered only for owners + Users-admins (gated in the layout).
export default function AuditTrail({ entries }: { entries: AuditItem[] }) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="absolute bottom-14 right-0 w-80 max-h-[70vh] overflow-y-auto bg-white border border-dark/10 rounded-2xl shadow-xl p-2">
          <div className="flex items-center justify-between px-2 py-2">
            <p className="font-mono text-[10px] text-coral uppercase tracking-widest">
              {"// audit trail"}
            </p>
            <span className="font-mono text-[10px] text-muted">{entries.length} recent</span>
          </div>
          {entries.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted">No changes recorded yet.</p>
          ) : (
            <ul className="flex flex-col">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="px-2 py-2 rounded-lg hover:bg-dark/[0.02] border-b border-dark/5 last:border-0"
                >
                  <p className="text-sm text-dark leading-snug">
                    <span className={`font-mono text-[10px] uppercase tracking-widest mr-1.5 ${ACTION_COLOR[e.action] ?? "text-dark/60"}`}>
                      {e.action}
                    </span>
                    {e.summary}
                  </p>
                  <p className="font-mono text-[10px] text-muted mt-0.5">
                    {actorLabel(e.actor)} · {now === null ? "" : timeAgo(e.created_at, now)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Audit trail"
        title="Audit trail — who changed what"
        className="w-12 h-12 flex items-center justify-center rounded-full bg-dark text-white shadow-lg hover:bg-coral transition text-lg"
      >
        <span aria-hidden>🕘</span>
      </button>
    </div>
  );
}
