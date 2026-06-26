"use client";

import { createContext, useContext, useEffect, useState } from "react";
import styles from "./Theme.module.css";

export type Theme = "1" | "2" | "3";

const OPTIONS: { id: Theme; label: string; sub: string }[] = [
  { id: "1", label: "Pixel", sub: "Y2K arcade" },
  { id: "3", label: "Editorial", sub: "CQ quiz" },
];

const ThemeCtx = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: "3", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeCtx);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("3");

  useEffect(() => {
    let initial: Theme = "3";
    try {
      const stored = localStorage.getItem("complex-quiz-theme") as Theme | null;
      if (stored === "1" || stored === "2" || stored === "3") initial = stored;
    } catch {
      /* ignore */
    }
    setThemeState(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("complex-quiz-theme", t);
    } catch {
      /* ignore */
    }
  };

  return (
    <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className={styles.toggle} role="tablist" aria-label="Visual direction">
      <span className={styles.toggleEyebrow}>Direction</span>
      <div className={styles.toggleRow}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={theme === opt.id}
            className={[
              styles.opt,
              theme === opt.id ? styles.optActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setTheme(opt.id)}
          >
            <span className={styles.optNum}>0{opt.id}</span>
            <span className={styles.optLabel}>{opt.label}</span>
            <span className={styles.optSub}>{opt.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
