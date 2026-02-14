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
