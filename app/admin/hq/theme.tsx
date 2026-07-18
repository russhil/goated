"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

// Charts and other client components read the current HQ theme from here.
export const useHqTheme = () => useContext(ThemeCtx);

export function HqThemeProvider({ children }: { children: React.ReactNode }) {
  // Start light on both server and first client render (avoids hydration
  // mismatch), then adopt the saved preference on mount.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hq-theme");
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () =>
    setTheme((t) => {
      const next: Theme = t === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("hq-theme", next);
      } catch {
        /* ignore */
      }
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
