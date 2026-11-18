/** The fields of a grade that decide how much it counts. */
export interface CountedGrade {
  value: number;
  weight: number;
  /** Fixed share (0–100) of the average; when set, `weight` is ignored. */
  percent?: number | null;
}

/** How a grade being entered counts: by relative weight, or as a fixed % of the subject's grade. */
export type WeightMode = "weight" | "percent";

/**
 * The `weight` / `percent` pair to send for a grade entered in `mode`,
 * or null when the active input isn't valid (weight NaN, percent outside (0, 100]).
 */
export function countingFields(mode: WeightMode, weight: string, percent: string): { weight: number; percent: number | null } | null {
  if (mode === "percent") {
    const p = parseFloat(percent);
    return p > 0 && p <= 100 ? { weight: 1, percent: p } : null;
  }
  const w = parseFloat(weight);
  return isNaN(w) ? null : { weight: w, percent: null };
}

/** True when the grade counts as a fixed percentage instead of by relative weight. */
export const isPercentGrade = (g: CountedGrade) => g.percent != null && g.percent > 0;

function weightedMean(grades: CountedGrade[], weightOf: (g: CountedGrade) => number): number | null {
  const total = grades.reduce((acc, g) => acc + weightOf(g), 0);
  if (grades.length === 0 || total <= 0) return null;
  return grades.reduce((acc, g) => acc + g.value * weightOf(g), 0) / total;
}

/** Sum of the percentages of a subject's percent grades. */
export function percentTotal(grades: CountedGrade[]): number {
  return grades.filter(isPercentGrade).reduce((acc, g) => acc + g.percent!, 0);
}

/**
 * Unrounded average of one subject's grades (before adjustments):
 * - weighted grades only: mean weighted by `weight` (weight 0 doesn't count);
 * - percent grades each count their share; weighted grades split the remainder,
 *   e.g. a 30% exam at 4.0 with weighted grades averaging 5.0 → 0.3·4 + 0.7·5 = 4.7;
 * - only percent grades so far, or 100% or more in total: their percent-weighted mean.
 */
export function gradeAverage(grades: CountedGrade[]): number | null {
  const percentGrades = grades.filter(isPercentGrade);
  const weightedAvg = weightedMean(grades.filter((g) => !isPercentGrade(g) && g.weight > 0), (g) => g.weight);
  if (percentGrades.length === 0) return weightedAvg;

  const percentAvg = weightedMean(percentGrades, (g) => g.percent!)!;
  const share = Math.min(1, percentTotal(percentGrades) / 100);
  if (weightedAvg === null || share === 1) return percentAvg;
  return percentAvg * share + weightedAvg * (1 - share);
}

/**
 * Grade needed on one more grade (counted like `next`) so the average reaches `target`.
 * The average is linear in the new grade's value, so two probes give the answer.
 * Null when the new grade can't move the average (e.g. weight 0).
 */
export function neededGrade(grades: CountedGrade[], next: Omit<CountedGrade, "value">, target: number): number | null {
  const at = (value: number) => gradeAverage([...grades, { ...next, value }])!;
  const base = at(0);
  const slope = at(1) - base;
  return slope > 1e-9 ? (target - base) / slope : null;
}
