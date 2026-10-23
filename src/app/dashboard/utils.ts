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

/*
  Muted grade scale ported from the calendar-gm design system: 4.0 is the pass
  pivot (amber); values trend green upward and red downward. The `key` maps to
  the authored `.grade-badge-*` / `.grade-fg-*` classes in globals.css, and
  `hex` is used for charts/SVGs where an inline color is required.
*/
const GRADE_THRESHOLDS: { min: number; key: string; hex: string }[] = [
  { min: 6,   key: "60", hex: "#2f9e44" },
  { min: 5.5, key: "55", hex: "#3d9456" },
  { min: 5,   key: "50", hex: "#5a9150" },
  { min: 4.5, key: "45", hex: "#8a9242" },
  { min: 4,   key: "40", hex: "#c98a00" },
  { min: 3.5, key: "35", hex: "#c47a1e" },
  { min: 3,   key: "30", hex: "#bd6a24" },
  { min: 2.5, key: "25", hex: "#b85a2a" },
  { min: 2,   key: "20", hex: "#c04f3a" },
  { min: 1.5, key: "15", hex: "#c0443f" },
  { min: 1,   key: "10", hex: "#e5484d" },
];

function thresholdFor(value: number) {
  return GRADE_THRESHOLDS.find((t) => value >= t.min) ?? GRADE_THRESHOLDS.at(-1)!;
}

/** Class for a grade badge (tinted fill + border + text color), theme-aware. */
export function getGradeColor(value: number): string {
  return `grade-badge-${thresholdFor(value).key}`;
}

/** Text-color class for a grade value, theme-aware. */
export function getAvgColor(value: number): string {
  return `grade-fg-${thresholdFor(value).key}`;
}

/** Muted hex color for a grade value (for use in charts / SVGs). */
export function getGradeHex(value: number): string {
  return thresholdFor(value).hex;
}

const SUBJECT_COLORS = [
  "blue", "orange", "violet", "teal", "green", "amber", "pink", "brown",
  "cyan", "indigo", "lime",
] as const;

/** Fixed, collision-free colors for the known KSH subjects. */
const SUBJECT_FIXED: Record<string, (typeof SUBJECT_COLORS)[number]> = {
  German: "blue", French: "orange", English: "violet", Math: "teal",
  WR: "green", FrW: "amber", GuP: "pink", TuU: "brown",
  IDAF: "cyan", IDPA: "indigo", PrWr: "lime",
};

const SUBJECT_HEX: Record<(typeof SUBJECT_COLORS)[number], string> = {
  blue: "#3e63dd", orange: "#e8590c", violet: "#8e4ec6", teal: "#0d9488",
  green: "#2f9e44", amber: "#c98a00", pink: "#d6409f", brown: "#9c6b44",
  cyan: "#0e9ed6", indigo: "#5b5bd6", lime: "#6ba52b",
};

/** The color key for a subject: fixed for known KSH subjects, hashed otherwise. */
function subjectColorKey(name: string): (typeof SUBJECT_COLORS)[number] {
  if (SUBJECT_FIXED[name]) return SUBJECT_FIXED[name];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SUBJECT_COLORS[h % SUBJECT_COLORS.length];
}

/** Subject color as a CSS var, from a subject/module name. */
export function subjectColorVar(name: string): string {
  return `var(--subject-${subjectColorKey(name)})`;
}

/** Subject color as a hex (for charts/SVG), from a subject/module name. */
export function subjectColorHex(name: string): string {
  return SUBJECT_HEX[subjectColorKey(name)];
}

/** Format a weight value for display — strips unnecessary trailing zeros (e.g. 0.33, 0.67, 0.5, 1). */
export function formatWeight(w: number): string {
  return Number(w.toFixed(2)).toString();
}

/** Round a number to the nearest 0.5 (Swiss school grade rounding). */
export function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

/** Round a number to 1 decimal place. */
export function roundTo1dp(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Format a Date or date string as a YYYY-MM-DD string suitable for date inputs. Defaults to today. */
export function toDateInputString(date?: Date | string): string {
  return (date !== undefined ? new Date(date) : new Date()).toISOString().split("T")[0];
}
