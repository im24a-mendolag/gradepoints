import type React from "react";

/** Keys that are allowed in number inputs (digits, decimal, navigation, etc). */
const ALLOWED_NUMBER_KEYS = new Set([
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ".",
  "Backspace", "Delete", "Tab", "Escape", "Enter",
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "Home", "End",
]);

/**
 * onKeyDown handler that blocks non-numeric characters (e, E, +, letters, etc.)
 * from being typed into a number input. Allows digits, decimal point,
 * navigation keys, and Ctrl/Cmd shortcuts (copy, paste, etc.).
 * Pass `allowNegative: true` to also permit the minus key.
 */
export function blockNonNumericKeys(
  e: React.KeyboardEvent<HTMLInputElement>,
  { allowNegative = false }: { allowNegative?: boolean } = {}
) {
  if (e.ctrlKey || e.metaKey) return; // allow Ctrl+C, Ctrl+V, etc.
  if (e.key === "-" && allowNegative) return;
  if (!ALLOWED_NUMBER_KEYS.has(e.key)) {
    e.preventDefault();
  }
}

const GRADE_THRESHOLDS: { min: number; badge: string; text: string; hex: string }[] = [
  { min: 6,   badge: "text-emerald-400 bg-emerald-900/30 border-emerald-700", text: "text-emerald-400", hex: "#34d399" },
  { min: 5.5, badge: "text-emerald-500 bg-emerald-900/30 border-emerald-800", text: "text-emerald-500", hex: "#10b981" },
  { min: 5,   badge: "text-green-400 bg-green-900/30 border-green-700",       text: "text-green-400",   hex: "#4ade80" },
  { min: 4.5, badge: "text-lime-400 bg-lime-900/30 border-lime-700",          text: "text-lime-400",    hex: "#a3e635" },
  { min: 4,   badge: "text-yellow-300 bg-yellow-900/20 border-yellow-700",    text: "text-yellow-300",  hex: "#fde047" },
  { min: 3.5, badge: "text-amber-400 bg-amber-900/30 border-amber-700",      text: "text-amber-400",   hex: "#fbbf24" },
  { min: 3,   badge: "text-orange-400 bg-orange-900/30 border-orange-700",    text: "text-orange-400",  hex: "#fb923c" },
  { min: 2.5, badge: "text-orange-500 bg-orange-900/40 border-orange-800",    text: "text-orange-500",  hex: "#f97316" },
  { min: 2,   badge: "text-red-400 bg-red-900/30 border-red-700",             text: "text-red-400",     hex: "#f87171" },
  { min: 1.5, badge: "text-red-500 bg-red-900/40 border-red-800",             text: "text-red-500",     hex: "#ef4444" },
  { min: 1,   badge: "text-red-600 bg-red-950/50 border-red-900",             text: "text-red-600",     hex: "#dc2626" },
];

function thresholdFor(value: number) {
  return GRADE_THRESHOLDS.find((t) => value >= t.min) ?? GRADE_THRESHOLDS.at(-1)!;
}

/** Tailwind classes for a grade badge (text + bg + border) — dark mode. */
export function getGradeColor(value: number): string {
  return thresholdFor(value).badge;
}

/** Tailwind text-color class for a grade value — dark mode. */
export function getAvgColor(value: number): string {
  return thresholdFor(value).text;
}

/** Hex color string for a grade value (for use in charts / SVGs). */
export function getGradeHex(value: number): string {
  return thresholdFor(value).hex;
}
