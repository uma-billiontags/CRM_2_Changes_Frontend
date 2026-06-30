// src/hooks/useTheme.ts
// Shared hook — call this in ANY component/layout that needs theme.
// It reads from / writes to localStorage AND sets data-theme on <html>,
// so CSS variables in index.css always cascade correctly.

import { useEffect, useState } from "react";

type Theme = "dark" | "light";
const KEY = "crm_theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Read persisted value on first render
    const saved = localStorage.getItem(KEY);
    return saved === "light" || saved === "dark" ? saved : "dark";
  });

  // Whenever theme changes → write to localStorage + apply to <html>
  useEffect(() => {
    localStorage.setItem(KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setThemeState((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}