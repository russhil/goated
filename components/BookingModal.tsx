"use client";

import { useEffect, useState } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { CAL_LINK } from "@/lib/booking";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function BookingModal({ isOpen, onClose }: Props) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    if (isOpen) setHasMounted(true);
  }, [isOpen]);

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "alignment-call" });
      cal("ui", {
        theme: "light",
        cssVarsPerTheme: {
          light: { "cal-brand": "#E8533A" },
          dark: { "cal-brand": "#E8533A" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[200] flex items-stretch md:items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className="absolute inset-0 bg-dark/70 backdrop-blur-sm cursor-default"
        onClick={onClose}
        aria-label="Close booking"
      />

      <div
        className={`relative w-full h-full md:h-[88vh] md:max-w-[1100px] md:mx-6 bg-white md:rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-dark/10 shrink-0 bg-white">
          <div className="font-mono text-xs md:text-sm tracking-tight">
            <span className="text-dark">[</span>
            <span className="text-dark font-bold">GOATED</span>
            <span className="text-coral font-bold">.</span>
            <span className="text-dark">]</span>
            <span className="text-muted ml-2 md:ml-3 hidden sm:inline">
              {"// book a call — explore how we can help your business"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-dark/5 text-dark/60 hover:text-dark transition cursor-pointer"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="relative flex-1 bg-white overflow-y-auto">
          {hasMounted && (
            <Cal
              namespace="alignment-call"
              calLink={CAL_LINK}
              style={{ width: "100%", height: "100%", minHeight: "100%" }}
              config={{ layout: "month_view", theme: "light" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
