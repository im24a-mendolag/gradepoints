import {
  SEMESTER_SUBJECTS,
  TOTAL_SEMESTERS,
  FINALS_SEMESTER,
  FINALS_ENTRIES,
  IDPA_FINAL_FOR_IDAF,
  OVERVIEW_SUBJECTS,
} from "@/lib/semesters";
import type { Grade, Adjustment, SemesterStatus, OverviewStatus, FinalSubjectGrade } from "../types";
import { roundToHalf, roundTo1dp } from "../utils";

export function makeKshComputations(
  kshGrades: Grade[],
  kshAdjustments: Adjustment[],
  finalsInputs: Record<string, string>
) {
  // Per-factory caches — valid for the lifetime of this memoized factory instance.
  const rawCache = new Map<string, number | null>();
  const avgCache = new Map<string, number | null>();
  const semAvgCache = new Map<number, number | null>();

  const getGradesForSubject = (semester: number, subject: string): Grade[] =>
    kshGrades.filter((g) => g.semester === semester && g.subject === subject);

  const getAdjustment = (semester: number, subject: string): number => {
    const adj = kshAdjustments.find((a) => a.semester === semester && a.subject === subject);
    return adj ? adj.value : 0;
  };

  const getRawSubjectAverage = (semester: number, subject: string): number | null => {
    const key = `${semester}|${subject}`;
    if (rawCache.has(key)) return rawCache.get(key)!;
    const subjectGrades = getGradesForSubject(semester, subject).filter((g) => g.weight > 0);
    let result: number | null = null;
    if (subjectGrades.length > 0) {
      const totalWeight = subjectGrades.reduce((acc, g) => acc + g.weight, 0);
      const weightedSum = subjectGrades.reduce((acc, g) => acc + g.value * g.weight, 0);
      result = Math.min(6, Math.max(1, weightedSum / totalWeight + getAdjustment(semester, subject)));
    }
    rawCache.set(key, result);
    return result;
  };

  const getSubjectAverage = (semester: number, subject: string): number | null => {
    const key = `${semester}|${subject}`;
    if (avgCache.has(key)) return avgCache.get(key)!;
    const raw = getRawSubjectAverage(semester, subject);
    const result = raw === null ? null : Math.min(6, Math.max(1, roundToHalf(raw)));
    avgCache.set(key, result);
    return result;
  };

  const getSemesterAverage = (semester: number): number | null => {
    if (semAvgCache.has(semester)) return semAvgCache.get(semester)!;
    const avgs = (SEMESTER_SUBJECTS[semester] ?? [])
      .map((s) => getSubjectAverage(semester, s))
      .filter((a): a is number => a !== null);
    const result = avgs.length === 0 ? null : avgs.reduce((a, b) => a + b, 0) / avgs.length;
    semAvgCache.set(semester, result);
    return result;
  };

  const getFinalsAverage = (): number | null => {
    const groups = [
      { entries: ["German (Oral)", "German (Written)"] },
      { entries: ["French (Oral)", "French (Written)"] },
      { entries: ["English (Oral)", "English (Written)"] },
      { entries: ["Math (Written)"] },
      { entries: ["WR (Written)"] },
      { entries: ["FrW (Written)"] },
    ];
    const groupAvgs = groups
      .map(({ entries }) => {
        const vals = entries
          .map((e) => { const g = getGradesForSubject(FINALS_SEMESTER, e); return g.length > 0 ? g[0].value : null; })
          .filter((v): v is number => v !== null);
        if (vals.length === 0) return null;
        return roundToHalf(vals.reduce((a, b) => a + b, 0) / vals.length);
      })
      .filter((a): a is number => a !== null);
    if (groupAvgs.length === 0) return null;
    return roundToHalf(groupAvgs.reduce((a, b) => a + b, 0) / groupAvgs.length);
  };

  const getOverallAverage = (): number | null => {
    const semAvgs = Array.from({ length: TOTAL_SEMESTERS }, (_, i) => getSemesterAverage(i + 1))
      .filter((a): a is number => a !== null);
    const finalsAvg = getFinalsAverage();
    const all = [...semAvgs, ...(finalsAvg !== null ? [finalsAvg] : [])];
    if (all.length === 0) return null;
    return all.reduce((a, b) => a + b, 0) / all.length;
  };

  const getSemesterStatus = (semester: number): SemesterStatus | null => {
    const subjectAvgs = (SEMESTER_SUBJECTS[semester] ?? [])
      .map((s) => ({ subject: s as string, avg: getSubjectAverage(semester, s) }))
      .filter((s): s is { subject: string; avg: number } => s.avg !== null);
    if (subjectAvgs.length === 0) return null;

    const semAvg = getSemesterAverage(semester);
    const below4 = subjectAvgs.filter((s) => s.avg < 4);
    const negPts = subjectAvgs.reduce((acc, s) => (s.avg < 4 ? acc + (4 - s.avg) : acc), 0);
    const r1 = semAvg !== null && semAvg >= 4;
    const r2 = below4.length <= 2;
    const r3 = negPts <= 2;

    return {
      passed: r1 && r2 && r3,
      semAvg,
      subjectsBelow4: below4.map((s) => s.subject),
      subjectsBelow4Count: below4.length,
      negativePoints: roundTo1dp(negPts),
      rule1Pass: r1,
      rule2Pass: r2,
      rule3Pass: r3,
    };
  };

  const getFinalsExamGrade = (subject: string): number | null => {
    const entries = FINALS_ENTRIES[subject];
    if (!entries) return null;
    const vals = entries
      .map((e) => { const g = getGradesForSubject(FINALS_SEMESTER, e); return g.length > 0 ? g[0].value : null; })
      .filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    return roundToHalf(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const getSemestersForSubject = (subject: string): number[] => {
    const result: number[] = [];
    for (let s = 1; s <= TOTAL_SEMESTERS; s++) {
      if ((SEMESTER_SUBJECTS[s] ?? []).includes(subject as never)) result.push(s);
    }
    return result;
  };

  const getIdpaGrade = (): number | null =>
    getSubjectAverage(IDPA_FINAL_FOR_IDAF.finalSemester, IDPA_FINAL_FOR_IDAF.finalSubject);

  const getFinalSubjectGrade = (subject: string): FinalSubjectGrade => {
    const sems = getSemestersForSubject(subject);
    const semAvgs = sems.map((s) => getSubjectAverage(s, subject)).filter((a): a is number => a !== null);
    const semesterAvg = semAvgs.length > 0
      ? roundToHalf(semAvgs.reduce((a, b) => a + b, 0) / semAvgs.length)
      : null;

    const finalsGrade = subject === IDPA_FINAL_FOR_IDAF.subject
      ? getIdpaGrade()
      : getFinalsExamGrade(subject);

    if (semesterAvg === null && finalsGrade === null) {
      return { semesterAvg: null, finalsGrade: null, finalGrade: null };
    }

    const finalGrade = semesterAvg !== null && finalsGrade !== null
      ? roundToHalf((semesterAvg + finalsGrade) / 2)
      : (semesterAvg ?? finalsGrade)!;

    return { semesterAvg, finalsGrade, finalGrade };
  };

  const getOverviewStatus = (): OverviewStatus | null => {
    const results = OVERVIEW_SUBJECTS
      .map((subject) => ({ subject, finalGrade: getFinalSubjectGrade(subject).finalGrade }))
      .filter((s): s is { subject: string; finalGrade: number } => s.finalGrade !== null);
    if (results.length === 0) return null;

    const avg = roundToHalf(results.reduce((a, s) => a + s.finalGrade, 0) / results.length);
    const below4 = results.filter((s) => s.finalGrade < 4);
    const negPts = results.reduce((a, s) => (s.finalGrade < 4 ? a + (4 - s.finalGrade) : a), 0);
    const r1 = avg >= 4;
    const r2 = below4.length <= 2;
    const r3 = negPts <= 2;

    return {
      passed: r1 && r2 && r3,
      avg,
      subjectResults: results,
      subjectsBelow4: below4.map((s) => s.subject),
      subjectsBelow4Count: below4.length,
      negativePoints: roundTo1dp(negPts),
      rule1Pass: r1,
      rule2Pass: r2,
      rule3Pass: r3,
    };
  };

  const getFinalsInputValue = (entry: string): string => {
    if (finalsInputs[entry] !== undefined) return finalsInputs[entry];
    const existing = getGradesForSubject(FINALS_SEMESTER, entry);
    return existing.length > 0 ? existing[0].value.toString() : "";
  };

  return {
    getGradesForSubject,
    getAdjustment,
    getRawSubjectAverage,
    getSubjectAverage,
    getSemesterAverage,
    getFinalsAverage,
    getOverallAverage,
    getSemesterStatus,
    getFinalsExamGrade,
    getSemestersForSubject,
    getFinalSubjectGrade,
    getOverviewStatus,
    getFinalsInputValue,
  };
}
