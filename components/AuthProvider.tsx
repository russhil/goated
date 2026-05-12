"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import SignInModal from "./SignInModal";
import posthog from "posthog-js";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isOpen: boolean;
  pendingNext: string | null;
  openSignIn: (next?: string) => void;
  closeSignIn: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingNext, setPendingNext] = useState<string | null>(null);

  // Hydrate session on mount + listen for auth state changes.
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      setUser(user);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      // If they just signed in, close the modal and identify in PostHog.
      if (session?.user) {
        setIsOpen(false);
        posthog.identify(session.user.id, { email: session.user.email });
      }
      if (event === "SIGNED_OUT") {
        posthog.reset();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const openSignIn = useCallback((next?: string) => {
    if (next) setPendingNext(next);
    setIsOpen(true);
  }, []);

  const closeSignIn = useCallback(() => {
    setIsOpen(false);
    setPendingNext(null);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  // Lock body scroll + Esc to close.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSignIn();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeSignIn]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isOpen, pendingNext, openSignIn, closeSignIn, signOut }}
    >
      {children}
      <SignInModal />
    </AuthContext.Provider>
  );
}
