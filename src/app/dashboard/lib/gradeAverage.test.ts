import { describe, expect, it } from "vitest";
import { countingFields, gradeAverage, neededGrade, percentTotal } from "./gradeAverage";

const w = (value: number, weight = 1) => ({ value, weight });
const p = (value: number, percent: number) => ({ value, weight: 1, percent });

describe("gradeAverage", () => {
  it("is the weighted mean when no grade is a percentage", () => {
    expect(gradeAverage([w(5, 2), w(4, 1), w(1, 0)])).toBeCloseTo(14 / 3);
    expect(gradeAverage([])).toBeNull();
    expect(gradeAverage([w(3, 0)])).toBeNull();
  });

  it("gives percent grades their share and splits the rest by weight", () => {
    // 30% exam at 4.0, weighted grades averaging 5.0 → 0.3·4 + 0.7·5
    expect(gradeAverage([p(4, 30), w(5), w(5, 2)])).toBeCloseTo(4.7);
    // two percent grades: 20% at 6 and 30% at 3, rest at 4 → 0.2·6 + 0.3·3 + 0.5·4
    expect(gradeAverage([p(6, 20), p(3, 30), w(4)])).toBeCloseTo(4.1);
  });

  it("uses only the percent grades when nothing else counts or they reach 100%", () => {
    expect(gradeAverage([p(4, 30)])).toBe(4);
    expect(gradeAverage([p(4, 30), w(6, 0)])).toBe(4);
    expect(gradeAverage([p(6, 25), p(3, 75)])).toBeCloseTo(3.75);
    expect(gradeAverage([p(6, 60), p(4, 60), w(1)])).toBe(5); // over 100%: weighted grades ignored
  });

  it("treats percent 0 or null as a normal weighted grade", () => {
    expect(gradeAverage([{ value: 3, weight: 1, percent: null }, { value: 5, weight: 1, percent: 0 }])).toBe(4);
  });
});

describe("percentTotal", () => {
  it("sums only percent grades", () => {
    expect(percentTotal([p(4, 30), p(5, 25.5), w(6)])).toBe(55.5);
    expect(percentTotal([w(6)])).toBe(0);
  });
});

describe("countingFields", () => {
  it("returns weight or percent for valid input, else null", () => {
    expect(countingFields("weight", "0.5", "")).toEqual({ weight: 0.5, percent: null });
    expect(countingFields("weight", "", "30")).toBeNull();
    expect(countingFields("percent", "2", "30")).toEqual({ weight: 1, percent: 30 });
    expect(countingFields("percent", "1", "0")).toBeNull();
    expect(countingFields("percent", "1", "150")).toBeNull();
    expect(countingFields("percent", "1", "")).toBeNull();
  });
});

describe("neededGrade", () => {
  it("solves for weighted and percent next grades", () => {
    expect(neededGrade([w(4), w(3)], { weight: 1 }, 3.75)).toBeCloseTo(4.25);
    expect(neededGrade([w(5)], { weight: 1, percent: 50 }, 3.75)).toBeCloseTo(2.5);
    expect(neededGrade([], { weight: 1, percent: 30 }, 4)).toBeCloseTo(4);
  });

  it("is null when the next grade can't move the average", () => {
    expect(neededGrade([w(5)], { weight: 0 }, 4)).toBeNull();
    expect(neededGrade([p(5, 60), p(4, 60)], { weight: 2 }, 4)).toBeNull();
  });
});
