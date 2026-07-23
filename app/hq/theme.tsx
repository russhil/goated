"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

// Charts and other client components read the current HQ theme from here.
export const useHqTheme = () => useContext(ThemeCtx);

export function HqThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: "light" | "dark";
}) {
  // Seed from the server-read cookie so SSR and the first client render agree on
  // the wrapper class — no light→dark flash on navigation.
  const [theme, setTheme] = useState<Theme>(initialTheme);

  // Mirror the theme onto <html> so the root/body (and the overscroll gutter)
  // stay dark behind the wrapper. Drop the class on unmount so non-HQ pages
  // don't inherit a dark background.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("hq-dark-root");
    else root.classList.remove("hq-dark-root");
    return () => {
      root.classList.remove("hq-dark-root");
    };
  }, [theme]);

  const toggle = () =>
    setTheme((t) => {
      const next: Theme = t === "dark" ? "light" : "dark";
      try {
        document.cookie =
          "hq-theme=" + next + ";path=/;max-age=31536000;samesite=lax";
      } catch {
        /* ignore */
      }
      document.documentElement.classList.toggle("hq-dark-root", next === "dark");
      return next;
    });

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <div className={`hq-root${theme === "dark" ? " hq-dark" : ""}`}>{children}</div>
    </ThemeCtx.Provider>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useHqTheme();
  return (
    <button
      onClick={toggle}
      title="Toggle light / dark"
      className="ml-auto px-3 py-2 rounded-full text-sm font-sans bg-dark/[0.04] text-dark/70 hover:bg-dark/10 transition"
    >
      {theme === "dark" ? "☀ light" : "☾ dark"}
    </button>
  );
}
