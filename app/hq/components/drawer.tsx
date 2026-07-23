"use client";

import { useEffect, useRef, useState } from "react";

// Right-side slide-over panel. Resizable — drag the left edge to widen it so
// dense forms (e.g. the company-expenses grid) are easy to read.
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
  const [width, setWidth] = useState(640);
  const dragging = useRef(false);

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

  useEffect(() => {
    if (!open) return;
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const w = window.innerWidth - e.clientX; // width = right edge → cursor
      setWidth(Math.max(380, Math.min(window.innerWidth - 32, w)));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="absolute right-0 top-0 h-full bg-light shadow-2xl overflow-y-auto"
        style={{ width, maxWidth: "100vw" }}
      >
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            dragging.current = true;
            document.body.style.userSelect = "none";
          }}
          className="absolute left-0 top-0 z-20 h-full w-1.5 cursor-ew-resize hover:bg-coral/40 transition-colors"
          title="Drag to resize"
        />
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
