import { BZZ_SEMESTER, BZZ_NORMAL_MODULES, BZZ_UK_MODULES, BZZ_IPA } from "@/lib/semesters";
import type { Grade, Adjustment, BzzPassFailStatus } from "../types";
import { roundToHalf } from "../utils";

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
    const modGrades = getBzzModuleGrades(mod).filter((g) => g.weight > 0);
    let result: number | null = null;
    if (modGrades.length > 0) {
      const totalWeight = modGrades.reduce((acc, g) => acc + g.weight, 0);
      const weightedSum = modGrades.reduce((acc, g) => acc + g.value * g.weight, 0);
      result = Math.min(6, Math.max(1, weightedSum / totalWeight + getBzzModuleAdjustment(mod)));
    }
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

  const getBzzNormalRawAverage = (): number | null => {
    const avgs = (BZZ_NORMAL_MODULES as readonly string[])
      .map((m) => getBzzModuleAverage(m))
      .filter((a): a is number => a !== null);
    if (avgs.length === 0) return null;
    return avgs.reduce((a, b) => a + b, 0) / avgs.length;
  };

  const getBzzNormalAverage = (): number | null => {
    const raw = getBzzNormalRawAverage();
    if (raw === null) return null;
    return roundToHalf(raw);
  };

  const getBzzUkRawAverage = (): number | null => {
    const avgs = (BZZ_UK_MODULES as readonly string[])
      .map((m) => getBzzModuleAverage(m))
      .filter((a): a is number => a !== null);
    if (avgs.length === 0) return null;
    return avgs.reduce((a, b) => a + b, 0) / avgs.length;
  };

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

  const getBzzIpaAverage = (): number | null => {
    const ipaGrades = getBzzModuleGrades(BZZ_IPA).filter((g) => g.weight > 0);
    if (ipaGrades.length === 0) return null;
    const totalWeight = ipaGrades.reduce((acc, g) => acc + g.weight, 0);
    const weightedSum = ipaGrades.reduce((acc, g) => acc + g.value * g.weight, 0);
    return Math.min(6, Math.max(1, weightedSum / totalWeight + getBzzModuleAdjustment(BZZ_IPA)));
  };

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
