"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBooking } from "./BookingProvider";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Blogs", href: "/blog" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { open: openBooking } = useBooking();

  const handleBook = () => {
    setMobileOpen(false);
    openBooking();
  };

  return (
    <>
      <nav
        className="fixed top-3 md:top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-1.5rem)] md:w-[calc(100%-3rem)] max-w-[1100px]"
        id="navbar"
      >
        <div
          className="flex items-center justify-between gap-2 px-3 md:px-4 py-2 rounded-full bg-gradient-to-br from-white/35 via-white/20 to-white/10 backdrop-blur-2xl backdrop-saturate-150 border border-white/40"
          style={{
            boxShadow:
              "0 8px 32px rgba(13,13,13,0.06), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(13,13,13,0.04)",
          }}
        >
          {/* Logo */}
          <Link href="/" className="font-mono text-sm tracking-tight select-none pl-2 shrink-0">
            <span className="text-dark">[</span>
            <span className="text-dark font-bold">GOATED</span>
            <span className="text-coral font-bold">.</span>
            <span className="text-dark">]</span>
          </Link>

          {/* Center nav - desktop */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : item.href === "/portfolio"
                  ? pathname === "/portfolio"
                  : item.href === "/blog"
                  ? pathname?.startsWith("/blog")
                  : false;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-sans transition-all duration-300 ${
                    isActive ? "bg-coral/10 text-coral" : "text-dark/70 hover:text-dark hover:bg-white/40"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* CTA - desktop */}
          <button
            onClick={handleBook}
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 bg-dark text-white rounded-full text-sm font-sans font-medium transition-all duration-300 hover:bg-coral hover:shadow-[0_4px_16px_rgba(232,83,58,0.35)] shrink-0"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Book a call
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 w-6 mr-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block h-[2px] bg-dark transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[5px]" : ""}`} />
            <span className={`block h-[2px] bg-dark transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-[2px] bg-dark transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[5px]" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-white z-[99] flex flex-col items-center justify-center gap-8 transition-all duration-500 md:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className="font-serif text-4xl text-dark hover:text-coral transition-colors"
          >
            {item.label}
          </Link>
        ))}
        <button
          onClick={handleBook}
          className="mt-4 inline-flex items-center gap-2 px-7 py-3 bg-dark text-white rounded-full text-base font-sans font-medium hover:bg-coral transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Book a call
        </button>
      </div>
    </>
  );
}
