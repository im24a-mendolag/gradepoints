"use client";

export type ThemePref = "dark" | "light" | "system";

const KEY = "gp-theme";

/** Reads the stored theme preference (defaults to "dark"). */
export function getThemePref(): ThemePref {
  if (typeof window === "undefined") return "dark";
  const t = window.localStorage.getItem(KEY);
  return t === "light" || t === "system" ? t : "dark";
}

/** Resolves a preference to the concrete theme to apply. */
export function resolveTheme(pref: ThemePref): "dark" | "light" {
  if (pref === "system") {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return pref;
}

/** Persists and applies a theme preference to <html data-theme>. */
export function setThemePref(pref: ThemePref) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, pref);
  document.documentElement.setAttribute("data-theme", resolveTheme(pref));
}
