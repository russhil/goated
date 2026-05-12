"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import posthog from "posthog-js";

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get("next") || "/explore/dashboard";

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  // If they already have a session, jump straight to the next page.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace(next);
    });
  }, [next, router]);

  const handleGoogle = async () => {
    posthog.capture("sign_in_initiated", { provider: "google" });
    setPending(true);
    setError("");

    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://goatedd.tech";

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
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-32 pb-20">
      <div className="w-full max-w-md">
        <Link href="/" className="font-mono text-sm tracking-tight inline-block mb-12">
          <span className="text-dark">[</span>
          <span className="text-dark font-bold">GOATED</span>
          <span className="text-coral font-bold">.</span>
          <span className="text-dark">]</span>
        </Link>

        <h1
          className="font-serif text-dark leading-[1.15] mb-3"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          Welcome.
        </h1>
        <p className="font-sans text-muted mb-10">
          {"// one click. no passwords. we'll never post on your behalf."}
        </p>

        <button
          onClick={handleGoogle}
          disabled={pending}
          className="group w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 border border-dark/15 hover:border-dark rounded-full font-sans text-sm font-medium text-dark hover:bg-dark hover:text-white transition-all duration-300 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>{pending ? "Redirecting to Google..." : "Continue with Google"}</span>
        </button>

        {error && <p className="font-sans text-sm text-red-600 mt-6">{error}</p>}

        <p className="font-mono text-xs text-muted/70 mt-10">
          {"// rate-limited by google + supabase. don't spam-click."}
        </p>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="font-mono text-muted">{"// loading..."}</p>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
