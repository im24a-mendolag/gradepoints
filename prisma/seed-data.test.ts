import { describe, expect, it, vi } from "vitest";
import { FINALS_WINDOW, bzzSpecs, kshSpecs, randomDate, randomGrade } from "./seed-data";
import { BZZ_NORMAL_MODULES, BZZ_UK_MODULES, SEMESTER_SUBJECTS } from "../src/lib/semesters";

describe("seed grade plans", () => {
  it("draws grades and dates within range", () => {
    for (let i = 0; i < 50; i++) {
      expect(randomGrade()).toBeGreaterThanOrEqual(3);
      expect(randomGrade()).toBeLessThanOrEqual(6);
    }
    const school = randomDate();
    expect(school >= new Date(2024, 8, 1) && school <= new Date(2026, 1, 14)).toBe(true);
  });

  it("dates every finals grade inside the June 2026 exam window", () => {
    const random = vi.spyOn(Math, "random");
    for (const r of [0, 0.5, 0.999]) {
      random.mockReturnValue(r);
      for (const { date } of kshSpecs().filter((s) => s.semester === 7)) {
        expect(date! >= FINALS_WINDOW.start && date! <= FINALS_WINDOW.end).toBe(true);
      }
    }
  });

  it("plans 2–4 grades per KSH subject plus every finals entry", () => {
    const specs = kshSpecs();
    const subjects = Object.values(SEMESTER_SUBJECTS).flat();
    for (const subject of new Set(subjects)) expect(specs.some((s) => s.subject === subject)).toBe(true);
    expect(specs.filter((s) => s.semester === 7)).toHaveLength(9);
    expect(specs.filter((s) => s.semester === 1 && s.subject === "Math").length).toBeGreaterThanOrEqual(2);
  });

  it("uses the high/low branch of every count step", () => {
    const random = vi.spyOn(Math, "random");
    random.mockReturnValue(0.99);
    expect(kshSpecs().filter((s) => s.semester === 1 && s.subject === "Math")).toHaveLength(4);
    const many = bzzSpecs();
    expect(many.filter((s) => s.subject === BZZ_NORMAL_MODULES[0]).map((s) => s.description)).toEqual(["LB1", "LB2", "LB3"]);
    expect(many.filter((s) => s.subject === BZZ_UK_MODULES[0]).map((s) => s.description)).toEqual(["ÜK Test", "ÜK Project"]);

    random.mockReturnValue(0);
    const few = bzzSpecs();
    expect(few.filter((s) => s.subject === BZZ_NORMAL_MODULES[0])).toHaveLength(1);
    expect(few.at(-1)).toMatchObject({ subject: "IPA", value: 5 });
  });
});
