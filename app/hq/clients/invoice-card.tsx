"use client";

import { useEffect } from "react";

// Full-screen preview card for a generated invoice. Opened when a phase's
// invoice is generated, instead of downloading straight away.
export default function InvoiceCard({
  invoiceId,
  invoiceNo,
  onClose,
}: {
  invoiceId: string;
  invoiceNo: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const src = `/hq/invoice/${invoiceId}`;

  const print = () => {
    const frame = document.getElementById("inv-frame") as HTMLIFrameElement | null;
    frame?.contentWindow?.focus();
    frame?.contentWindow?.print();
  };

  return (
    <div className="fixed inset-0 z-[110]">
      <div className="absolute inset-0 bg-dark/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-3 md:inset-10 bg-light rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-dark/10 px-5 py-3 flex-wrap">
          <p className="font-serif text-lg text-dark">
            Invoice <span className="font-mono text-base text-muted">{invoiceNo}</span>
          </p>
          <div className="flex items-center gap-2">
            <a
              href={`${src}?download=1`}
              className="px-4 py-2 rounded-full text-xs font-medium bg-dark text-white hover:bg-coral transition-colors"
            >
              Download
            </a>
            <button
              type="button"
              onClick={print}
              className="px-4 py-2 rounded-full text-xs font-medium bg-dark/[0.04] text-dark/70 hover:bg-dark/10 transition-colors"
            >
              Print
            </button>
            <button
              type="button"
              disabled
              title="Email sending isn't set up yet — pick an email service to enable this"
              className="px-4 py-2 rounded-full text-xs font-medium bg-dark/[0.04] text-dark/40 cursor-not-allowed"
            >
              Email recipient
            </button>
            <button
              onClick={onClose}
              className="font-mono text-xs text-muted hover:text-dark transition-colors ml-1"
            >
              close ✕
            </button>
          </div>
        </div>
        <iframe id="inv-frame" src={src} title={`Invoice ${invoiceNo}`} className="flex-1 w-full bg-white" />
      </div>
    </div>
  );
}
