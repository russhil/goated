"use client";

import { useEffect, useRef, useState } from "react";

export type OffTrackItem = {
  clientId: string;
  clientName: string;
  subName: string;
  dueDate: string | null;
};

export default function Notifications({ items }: { items: OffTrackItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = items.length;

  // Close on click outside the bell + panel.
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
        aria-label={count > 0 ? `${count} off track` : "Notifications"}
        title={count > 0 ? `${count} off track` : "All projects on track"}
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
          {count > 0 ? (
            <>
              <div className="font-mono text-[10px] text-red-600 uppercase tracking-widest px-2 py-2">
                {`⚑ ${count} off track`}
              </div>
              <ul className="flex flex-col">
                {items.map((it, i) => (
                  <li key={`${it.clientId}-${it.subName}-${i}`}>
                    <a
                      href={`/admin/hq/clients/${it.clientId}`}
                      onClick={() => setOpen(false)}
                      className="block px-2 py-2 rounded-lg hover:bg-dark/[0.02] transition"
                    >
                      <span className="block text-sm text-dark">
                        {it.clientName} · {it.subName}
                      </span>
                      {it.dueDate && (
                        <span className="block font-mono text-[10px] text-muted mt-0.5">
                          due {it.dueDate}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="px-2 py-3 text-sm text-muted">All projects on track.</p>
          )}
        </div>
      )}
    </div>
  );
}
