import { BZZ_SEMESTER, BZZ_NORMAL_MODULES, BZZ_UK_MODULES, BZZ_IPA } from "@/lib/semesters";
import type { Grade, Adjustment, BzzPassFailStatus } from "../types";
import { roundToHalf } from "../utils";
import { gradeAverage } from "./gradeAverage";

const clampGrade = (n: number) => Math.min(6, Math.max(1, n));

export function makeBzzComputations(bzzGrades: Grade[], bzzAdjustments: Adjustment[]) {
  // Per-factory caches — valid for the lifetime of this memoized factory instance.
  const rawCache = new Map<string, number | null>();
  const avgCache = new Map<string, number | null>();

  const getBzzModuleGrades = (mod: string): Grade[] =>
    bzzGrades.filter((g) => g.semester === BZZ_SEMESTER && g.subject === mod);

  const getBzzModuleAdjustment = (mod: string): number => {
    const adj = bzzAdjustments.find((a) => a.semester === BZZ_SEMESTER && a.subject === mod);
    return adj ? adj.value : 0;
  };

  const getBzzModuleRawAverage = (mod: string): number | null => {
    if (rawCache.has(mod)) return rawCache.get(mod)!;
    const avg = gradeAverage(getBzzModuleGrades(mod));
    const result = avg === null ? null : clampGrade(avg + getBzzModuleAdjustment(mod));
    rawCache.set(mod, result);
    return result;
  };

  const getBzzModuleAverage = (mod: string): number | null => {
    if (avgCache.has(mod)) return avgCache.get(mod)!;
    const raw = getBzzModuleRawAverage(mod);
    const result = raw === null ? null : Math.min(6, Math.max(1, roundToHalf(raw)));
    avgCache.set(mod, result);
    return result;
  };

  // Mean of the rounded module averages across a module group.
  const getGroupRawAverage = (modules: readonly string[]): number | null => {
    const avgs = modules
      .map((m) => getBzzModuleAverage(m))
      .filter((a): a is number => a !== null);
    if (avgs.length === 0) return null;
    return avgs.reduce((a, b) => a + b, 0) / avgs.length;
  };

  const getBzzNormalRawAverage = (): number | null => getGroupRawAverage(BZZ_NORMAL_MODULES);

  const getBzzNormalAverage = (): number | null => {
    const raw = getBzzNormalRawAverage();
    if (raw === null) return null;
    return roundToHalf(raw);
  };

  const getBzzUkRawAverage = (): number | null => getGroupRawAverage(BZZ_UK_MODULES);

  const getBzzUkAverage = (): number | null => {
    const raw = getBzzUkRawAverage();
    if (raw === null) return null;
    return roundToHalf(raw);
  };

  // Returns null until both categories have data to avoid a misleading status.
  const getBzzFinalAverage = (): number | null => {
    const normalAvg = getBzzNormalAverage();
    const ukAvg = getBzzUkAverage();
    if (normalAvg === null || ukAvg === null) return null;
    return (normalAvg + ukAvg) / 2;
  };

  // The IPA is a module too, but its grade is shown unrounded.
  const getBzzIpaAverage = (): number | null => getBzzModuleRawAverage(BZZ_IPA);

  const getBzzPassFail = (): BzzPassFailStatus => {
    const normalAvg = getBzzNormalAverage();
    const ukAvg = getBzzUkAverage();
    const finalAvg = getBzzFinalAverage();
    const ipaGrade = getBzzIpaAverage();
    const ipaPass = ipaGrade !== null ? ipaGrade >= 4 : null;
    const avgPass = finalAvg !== null ? finalAvg >= 4 : null;
    const passed = avgPass === true && (ipaPass === true || ipaPass === null);
    return { passed, normalAvg, ukAvg, finalAvg, ipaGrade, ipaPass };
  };

  return {
    getBzzModuleGrades,
    getBzzModuleAdjustment,
    getBzzModuleRawAverage,
    getBzzModuleAverage,
    getBzzNormalRawAverage,
    getBzzNormalAverage,
    getBzzUkRawAverage,
    getBzzUkAverage,
    getBzzFinalAverage,
    getBzzIpaAverage,
    getBzzPassFail,
  };
}
