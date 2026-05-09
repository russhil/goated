"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthProvider";

// Soft client-side rate limit so spam-clicking the button doesn't fire
// a flood of OAuth redirects. (Server-side rate-limiting still lives in Supabase.)
let lastClickAt = 0;
const CLICK_COOLDOWN_MS = 1500;

export default function SignInModal() {
  const { isOpen, closeSignIn, pendingNext } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    const now = Date.now();
    if (now - lastClickAt < CLICK_COOLDOWN_MS) return;
    lastClickAt = now;

    setPending(true);
    setError("");

    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://goatedd.tech";
    const next = pendingNext || window.location.pathname || "/explore/dashboard";

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { prompt: "select_account" },
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setPending(false);
    }
    // On success the browser navigates to Google — no need to flip pending back.
  };

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[200] flex items-stretch md:items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className="absolute inset-0 bg-dark/70 backdrop-blur-sm cursor-default"
        onClick={closeSignIn}
        aria-label="Close sign in"
      />

      <div
        className={`relative w-full md:w-[440px] md:mx-6 bg-white md:rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-dark/10">
          <div className="font-mono text-xs md:text-sm tracking-tight">
            <span className="text-dark">[</span>
            <span className="text-dark font-bold">GOATED</span>
            <span className="text-coral font-bold">.</span>
            <span className="text-dark">]</span>
            <span className="text-muted ml-2 hidden sm:inline">{"// sign in"}</span>
          </div>
          <button
            onClick={closeSignIn}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-dark/5 text-dark/60 hover:text-dark transition cursor-pointer"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 md:px-8 pt-10 pb-8 flex flex-col items-center text-center">
          <h2
            className="font-serif text-dark mb-2"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}
          >
            Welcome.
          </h2>
          <p className="font-sans text-muted text-sm mb-8 max-w-sm">
            One click. No passwords. We&apos;ll never post or message anyone on your behalf.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={pending}
            className="group w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 border border-dark/15 hover:border-dark rounded-full font-sans text-sm font-medium text-dark hover:bg-dark hover:text-white transition-all duration-300 disabled:opacity-60 cursor-pointer"
          >
            {/* Google G */}
            <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{pending ? "Redirecting to Google..." : "Continue with Google"}</span>
          </button>

          {error && (
            <p className="font-sans text-xs text-red-600 mt-4">{error}</p>
          )}

          <p className="font-mono text-[11px] text-muted/70 mt-8 max-w-sm">
            {"// new here? google sign-in creates your account on the first try."}
          </p>
        </div>
      </div>
    </div>
  );
}
