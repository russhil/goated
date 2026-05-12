"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBooking } from "./BookingProvider";
import { useAuth } from "./AuthProvider";
import { isAdmin } from "@/lib/admin";
import posthog from "posthog-js";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Explore Jobs", href: "/explore" },
  { label: "Blogs", href: "/blog" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { open: openBooking } = useBooking();
  const { user, loading, openSignIn, signOut } = useAuth();
  const userIsAdmin = isAdmin(user?.email);
  const initial = (user?.email || "?").charAt(0).toUpperCase();

  const handleBook = (source: "navbar_desktop" | "navbar_mobile") => {
    posthog.capture("booking_cta_clicked", { source });
    setMobileOpen(false);
    openBooking();
  };

  const handleSignIn = () => {
    setMobileOpen(false);
    openSignIn(pathname || "/explore/dashboard");
  };

  const handleSignOut = async () => {
    setMobileOpen(false);
    await signOut();
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
                  : item.href === "/explore"
                  ? pathname?.startsWith("/explore")
                  : item.href === "/blog"
                  ? pathname?.startsWith("/blog")
                  : false;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-sans transition-all duration-300 whitespace-nowrap ${
                    isActive ? "bg-coral/10 text-coral" : "text-dark/70 hover:text-dark hover:bg-white/40"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Auth — desktop */}
          {!loading && (
            <div className="hidden md:flex items-center gap-1 mr-1 shrink-0">
              {user ? (
                <div className="relative group">
                  <Link
                    href="/explore/dashboard"
                    aria-label="Account"
                    className="block w-8 h-8 rounded-full bg-coral text-white flex items-center justify-center font-mono text-xs font-bold ring-2 ring-transparent hover:ring-coral/40 transition"
                  >
                    {initial}
                  </Link>
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-xl border border-dark/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                    <div className="absolute -top-2 right-0 h-2 w-full" />

                    <div className="px-4 py-3 border-b border-dark/10">
                      <p className="font-mono text-[11px] text-muted truncate">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/explore/dashboard"
                      className="block px-4 py-2.5 font-sans text-sm text-dark hover:bg-dark/5 transition"
                    >
                      Your applications
                    </Link>
                    {userIsAdmin && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2.5 font-sans text-sm text-coral hover:bg-coral/5 transition"
                      >
                        Admin panel
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 font-sans text-sm text-muted hover:text-dark hover:bg-dark/5 transition"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="px-3 py-1.5 rounded-full text-sm font-sans text-dark/70 hover:text-dark hover:bg-white/40 transition-all duration-300 whitespace-nowrap"
                >
                  Sign in
                </button>
              )}
            </div>
          )}

          {/* CTA - desktop */}
          <button
            onClick={() => handleBook("navbar_desktop")}
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 bg-dark text-white rounded-full text-sm font-sans font-medium transition-all duration-300 hover:bg-coral hover:shadow-[0_4px_16px_rgba(232,83,58,0.35)] hover:-translate-y-0.5 shrink-0 animate-soft-pulse"
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
        {!loading && user && userIsAdmin && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="font-serif text-2xl text-coral hover:underline transition-colors"
          >
            Admin
          </Link>
        )}
        {!loading && user && (
          <Link
            href="/explore/dashboard"
            onClick={() => setMobileOpen(false)}
            className="font-serif text-2xl text-dark/70 hover:text-coral transition-colors"
          >
            Your applications
          </Link>
        )}
        <button
          onClick={() => handleBook("navbar_mobile")}
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
        {!loading && (
          user ? (
            <button
              onClick={handleSignOut}
              className="font-mono text-sm text-muted hover:text-dark transition-colors"
            >
              {"// sign out"}
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="font-mono text-sm text-muted hover:text-dark transition-colors"
            >
              {"// sign in"}
            </button>
          )
        )}
      </div>
    </>
  );
}
