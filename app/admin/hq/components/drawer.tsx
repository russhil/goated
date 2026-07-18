"use client";

import { useEffect } from "react";

// Right-side slide-over panel. Used for the "new client" and "add sub-project"
// forms so they open in a side tab instead of sitting inline on the page.
export default function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-light shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-dark/10 bg-light/95 px-6 py-4 backdrop-blur">
          <p className="font-serif text-xl text-dark">{title}</p>
          <button
            onClick={onClose}
            className="font-mono text-xs text-muted hover:text-dark transition-colors"
          >
            close ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
