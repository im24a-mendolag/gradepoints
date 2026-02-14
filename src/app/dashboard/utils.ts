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

/**
 * Returns Tailwind CSS classes for a grade badge (text, background, border colors) — dark mode.
 * @param value - The grade value (1–6 scale).
 * @returns A string of Tailwind CSS classes.
 */
export function getGradeColor(value: number): string {
  if (value >= 5.5) return "text-green-400 bg-green-900/30 border-green-700";
  if (value >= 4.5) return "text-blue-400 bg-blue-900/30 border-blue-700";
  if (value >= 4) return "text-yellow-400 bg-yellow-900/30 border-yellow-700";
  return "text-red-400 bg-red-900/30 border-red-700";
}

/**
 * Returns a Tailwind CSS text-color class for an average value — dark mode.
 * @param value - The average value (1–6 scale).
 * @returns A Tailwind text-color class.
 */
export function getAvgColor(value: number): string {
  if (value >= 5.5) return "text-green-400";
  if (value >= 4.5) return "text-blue-400";
  if (value >= 4) return "text-yellow-400";
  return "text-red-400";
}
