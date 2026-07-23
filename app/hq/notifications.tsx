"use client";

import { useEffect, useRef, useState } from "react";

export type OffTrackItem = {
  clientId: string;
  clientName: string;
  subName: string;
  dueDate: string | null;
};

// A "New"-stage prospect that's been sitting ≥ 1 week without being moved on.
export type ReachOutItem = {
  id: string;
  name: string;
  company: string | null;
  ageDays: number;
};

export default function Notifications({
  items,
  prospects = [],
}: {
  items: OffTrackItem[];
  prospects?: ReachOutItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = items.length + prospects.length;

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={count > 0 ? `${count} notifications` : "Notifications"}
        title={count > 0 ? `${count} notifications` : "All clear"}
        className="relative px-3 py-2 rounded-full text-base font-sans bg-dark/[0.04] text-dark/70 hover:bg-dark/10 transition"
      >
        <span aria-hidden>⚑</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-white border border-dark/10 text-red-600 text-[10px] font-mono leading-none">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto z-50 bg-white border border-dark/10 rounded-xl shadow-lg p-2">
          {count === 0 && <p className="px-2 py-3 text-sm text-muted">All clear — nothing needs attention.</p>}

          {items.length > 0 && (
            <>
              <div className="font-mono text-[10px] text-red-600 uppercase tracking-widest px-2 py-2">
                {`⚑ ${items.length} off track`}
              </div>
              <ul className="flex flex-col">
                {items.map((it, i) => (
                  <li key={`${it.clientId}-${it.subName}-${i}`}>
                    <a
                      href={`/hq/clients/${it.clientId}`}
                      onClick={() => setOpen(false)}
                      className="block px-2 py-2 rounded-lg hover:bg-dark/[0.02] transition"
                    >
                      <span className="block text-sm text-dark">
                        {it.clientName} · {it.subName}
                      </span>
                      {it.dueDate && (
                        <span className="block font-mono text-[10px] text-muted mt-0.5">due {it.dueDate}</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          {prospects.length > 0 && (
            <>
              <div className="font-mono text-[10px] text-coral uppercase tracking-widest px-2 py-2">
                {`↗ reach out — ${prospects.length} new prospect${prospects.length === 1 ? "" : "s"}`}
              </div>
              <ul className="flex flex-col">
                {prospects.map((p) => (
                  <li key={p.id}>
                    <a
                      href="/hq/prospects"
                      onClick={() => setOpen(false)}
                      className="block px-2 py-2 rounded-lg hover:bg-dark/[0.02] transition"
                    >
                      <span className="block text-sm text-dark">
                        {p.name}
                        {p.company ? ` · ${p.company}` : ""}
                      </span>
                      <span className="block font-mono text-[10px] text-muted mt-0.5">
                        new for {p.ageDays}d — follow up
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
