import { describe, expect, it } from "vitest";
import { makeKshComputations } from "./kshComputations";
import { makeBzzComputations } from "./bzzComputations";
import { grade } from "../../../../test/fakeApi";
import type { Adjustment } from "../types";

const adj = (semester: number, subject: string, value: number, school: "KSH" | "BZZ" = "KSH"): Adjustment => ({
  id: `${semester}-${subject}`,
  semester,
  subject,
  value,
  school,
});

describe("makeKshComputations", () => {
  it("computes weighted, adjusted and rounded subject averages", () => {
    const ksh = makeKshComputations(
      [
        grade({ subject: "Math", value: 5, weight: 2 }),
        grade({ subject: "Math", value: 4, weight: 1 }),
        grade({ subject: "Math", value: 1, weight: 0 }), // ignored
      ],
      [adj(1, "Math", 0.25)],
      {},
    );
    expect(ksh.getRawSubjectAverage(1, "Math")).toBeCloseTo(14 / 3 + 0.25);
    expect(ksh.getSubjectAverage(1, "Math")).toBe(5);
    expect(ksh.getAdjustment(1, "German")).toBe(0);
    expect(ksh.getSubjectAverage(1, "German")).toBeNull();
    // cached path
    expect(ksh.getSubjectAverage(1, "Math")).toBe(5);
  });

  it("clamps raw averages to the 1–6 scale", () => {
    const ksh = makeKshComputations([grade({ subject: "Math", value: 6 })], [adj(1, "Math", 2)], {});
    expect(ksh.getRawSubjectAverage(1, "Math")).toBe(6);
  });

  it("averages a semester and reports pass/fail rules", () => {
    const ksh = makeKshComputations(
      [
        grade({ subject: "Math", value: 3 }),
        grade({ subject: "German", value: 3 }),
        grade({ subject: "French", value: 3.5 }),
        grade({ subject: "English", value: 6 }),
      ],
      [],
      {},
    );
    expect(ksh.getSemesterAverage(1)).toBeCloseTo((3 + 3 + 3.5 + 6) / 4);
    const status = ksh.getSemesterStatus(1)!;
    expect(status.subjectsBelow4).toEqual(["German", "French", "Math"]);
    expect(status.rule2Pass).toBe(false);
    expect(status.negativePoints).toBe(2.5);
    expect(status.rule3Pass).toBe(false);
    expect(status.passed).toBe(false);
    expect(ksh.getSemesterStatus(2)).toBeNull();
    expect(ksh.getSemesterAverage(2)).toBeNull();
  });

  it("combines semester and finals grades, including IDPA as the IDAF final", () => {
    const ksh = makeKshComputations(
      [
        grade({ subject: "German", value: 5, semester: 1 }),
        grade({ subject: "German", value: 5, semester: 2 }),
        grade({ subject: "German (Oral)", value: 4, semester: 7 }),
        grade({ subject: "German (Written)", value: 5, semester: 7 }),
        grade({ subject: "Math (Written)", value: 3, semester: 7 }),
        grade({ subject: "IDAF", value: 4, semester: 3 }),
        grade({ subject: "IDPA", value: 6, semester: 6 }),
      ],
      [],
      {},
    );
    expect(ksh.getFinalsExamGrade("German")).toBe(4.5);
    expect(ksh.getFinalsExamGrade("GuP")).toBeNull();
    expect(ksh.getFinalsExamGrade("French")).toBeNull();
    expect(ksh.getFinalSubjectGrade("German")).toEqual({ semesterAvg: 5, finalsGrade: 4.5, finalGrade: 5 });
    expect(ksh.getFinalSubjectGrade("Math")).toEqual({ semesterAvg: null, finalsGrade: 3, finalGrade: 3 });
    expect(ksh.getFinalSubjectGrade("IDAF")).toEqual({ semesterAvg: 4, finalsGrade: 6, finalGrade: 5 });
    expect(ksh.getFinalSubjectGrade("TuU")).toEqual({ semesterAvg: null, finalsGrade: null, finalGrade: null });
    expect(ksh.getFinalsAverage()).toBe(4);
    expect(ksh.getSemestersForSubject("IDAF")).toEqual([3, 4]);
    expect(ksh.getOverallAverage()).not.toBeNull();

    const overview = ksh.getOverviewStatus()!;
    expect(overview.subjectsBelow4).toEqual(["Math"]);
    expect(overview.rule1Pass).toBe(true);
    expect(overview.passed).toBe(true);
  });

  it("returns empty results without grades and reads finals inputs", () => {
    const ksh = makeKshComputations([], [], { "German (Oral)": "5" });
    expect(ksh.getOverviewStatus()).toBeNull();
    expect(ksh.getFinalsAverage()).toBeNull();
    expect(ksh.getOverallAverage()).toBeNull();
    expect(ksh.getFinalsInputValue("German (Oral)")).toBe("5");
    expect(ksh.getFinalsInputValue("Math (Written)")).toBe("");
  });

  it("prefers an existing finals grade over an empty input", () => {
    const ksh = makeKshComputations([grade({ subject: "Math (Written)", value: 4.5, semester: 7 })], [], {});
    expect(ksh.getFinalsInputValue("Math (Written)")).toBe("4.5");
  });
});

describe("makeBzzComputations", () => {
  const g = (subject: string, value: number, weight = 1) => grade({ subject, value, weight, school: "BZZ" });

  it("averages modules, groups and the final", () => {
    const bzz = makeBzzComputations(
      [g("431", 5), g("431", 4, 3), g("117", 1, 0), g("187", 4.5), g("IPA", 5)],
      [adj(1, "431", 0.5, "BZZ")],
    );
    expect(bzz.getBzzModuleRawAverage("431")).toBeCloseTo(4.25 + 0.5);
    expect(bzz.getBzzModuleAverage("431")).toBe(5);
    expect(bzz.getBzzModuleAverage("431")).toBe(5); // cached
    expect(bzz.getBzzModuleRawAverage("117")).toBeNull();
    expect(bzz.getBzzModuleAdjustment("117")).toBe(0);
    expect(bzz.getBzzNormalAverage()).toBe(5);
    expect(bzz.getBzzUkAverage()).toBe(4.5);
    expect(bzz.getBzzFinalAverage()).toBe(4.75);
    expect(bzz.getBzzIpaAverage()).toBe(5);
    expect(bzz.getBzzPassFail()).toMatchObject({ passed: true, ipaPass: true, finalAvg: 4.75 });
  });

  it("is undecided without data and fails on a failed IPA", () => {
    expect(makeBzzComputations([], []).getBzzPassFail()).toMatchObject({
      passed: false,
      finalAvg: null,
      ipaPass: null,
      normalAvg: null,
      ukAvg: null,
    });
    const failedIpa = makeBzzComputations([g("431", 5), g("187", 5), g("IPA", 3)], []);
    expect(failedIpa.getBzzPassFail()).toMatchObject({ passed: false, ipaPass: false });
    expect(makeBzzComputations([g("431", 5)], []).getBzzFinalAverage()).toBeNull();
  });
});
