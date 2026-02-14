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
 * Returns Tailwind CSS classes for a grade badge (text, background, border colors).
 * @param value - The grade value (1–6 scale).
 * @returns A string of Tailwind CSS classes: green for ≥5.5, blue for ≥4.5, yellow for ≥4, red otherwise.
 */
export function getGradeColor(value: number): string {
  if (value >= 5.5) return "text-green-600 bg-green-50 border-green-200";
  if (value >= 4.5) return "text-blue-600 bg-blue-50 border-blue-200";
  if (value >= 4) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-red-600 bg-red-50 border-red-200";
}

/**
 * Returns a Tailwind CSS text-color class for an average value.
 * @param value - The average value (1–6 scale).
 * @returns A Tailwind text-color class: green for ≥5.5, blue for ≥4.5, yellow for ≥4, red otherwise.
 */
export function getAvgColor(value: number): string {
  if (value >= 5.5) return "text-green-600";
  if (value >= 4.5) return "text-blue-600";
  if (value >= 4) return "text-yellow-600";
  return "text-red-600";
}
