import { useEffect, useState } from "react";

export function useTheme() {
  const [dark, setDark] = useState<boolean>(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : false,
  );

  useEffect(() => {
    const mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    const pref = localStorage.getItem("finance.theme");
    if (!pref && mq?.matches) {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem("finance.theme");
      if (stored) return; // respect manual choice
      if (e.matches) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      setDark(e.matches);
    };
    mq?.addEventListener?.("change", handler);
    return () => mq?.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  return { isDark: dark } as const;
}
