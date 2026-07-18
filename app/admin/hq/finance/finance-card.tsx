"use client";

import { useState, type ReactNode } from "react";
import Drawer from "../components/drawer";

// A summary card that shows a headline number and opens a drawer with the full
// detail on click. Owns the drawer open state so the finance page can stay a
// server component and pass server-rendered detail as `children`.
export default function FinanceCard({
  label,
  headline,
  sub,
  title,
  children,
}: {
  label: string;
  headline: ReactNode;
  sub?: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group text-left flex flex-col bg-white border border-dark/10 rounded-2xl p-5 hover:border-coral/40 hover:shadow-sm transition-all"
      >
        <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-3">
          {label}
        </p>
        <div className="font-serif text-2xl text-dark leading-tight">{headline}</div>
        {sub && <p className="font-sans text-sm text-muted mt-1">{sub}</p>}
        <p className="font-mono text-[10px] text-muted uppercase tracking-widest mt-4 group-hover:text-coral transition-colors">
          open →
        </p>
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={title}>
        {children}
      </Drawer>
    </>
  );
}
