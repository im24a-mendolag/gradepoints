// Pure grade plans for the seed script (kept separate so they can be tested without a DB).
import {
  SEMESTER_SUBJECTS,
  FINALS_ENTRIES,
  FINALS_SEMESTER,
  BZZ_SEMESTER,
  BZZ_NORMAL_MODULES,
  BZZ_UK_MODULES,
  BZZ_IPA,
} from "../src/lib/semesters";

// ─── Helpers ────────────────────────────────────────────────────

export function randomGrade(): number {
  const grades = [3.0, 3.5, 4.0, 4.0, 4.5, 4.5, 4.5, 5.0, 5.0, 5.0, 5.5, 5.5, 6.0];
  return grades[Math.floor(Math.random() * grades.length)];
}

/** Uniformly random moment between two dates (start must be before end). */
export function randomDateBetween(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/** A date in the seeded school period: 1 Sep 2024 – 14 Feb 2026. */
export function randomDate(): Date {
  return randomDateBetween(new Date(2024, 8, 1), new Date(2026, 1, 14));
}

/** Finals exam window for the seeded demo data (June 2026). */
export const FINALS_WINDOW = { start: new Date(2026, 5, 1), end: new Date(2026, 5, 30) } as const;

/** Picks a count from weighted thresholds, e.g. pickCount([[0.3, 2], [0.7, 3]], 4). */
function pickCount(steps: [number, number][], fallback: number) {
  for (const [p, n] of steps) if (Math.random() < p) return n;
  return fallback;
}

export interface GradeSpec {
  subject: string;
  semester: number;
  description: string;
  value?: number;
  date?: Date;
}

// ─── Grade plans ────────────────────────────────────────────────

export function kshSpecs(): GradeSpec[] {
  const specs: GradeSpec[] = [];
  for (const [sem, subjects] of Object.entries(SEMESTER_SUBJECTS)) {
    for (const subject of subjects) {
      const count = pickCount([[0.3, 2], [0.7, 3]], 4);
      for (let i = 0; i < count; i++) {
        const description = ["Test", "Exam", "Quiz", "Presentation"][i] ?? "Test";
        specs.push({ subject, semester: parseInt(sem), description });
      }
    }
  }
  for (const entry of Object.values(FINALS_ENTRIES).flat()) {
    specs.push({ subject: entry, semester: FINALS_SEMESTER, description: "", date: randomDateBetween(FINALS_WINDOW.start, FINALS_WINDOW.end) });
  }
  return specs;
}

export function bzzSpecs(): GradeSpec[] {
  const specs: GradeSpec[] = [];
  for (const mod of BZZ_NORMAL_MODULES) {
    const count = pickCount([[0.3, 1], [0.6, 2]], 3);
    for (let i = 0; i < count; i++) {
      specs.push({ subject: mod, semester: BZZ_SEMESTER, description: `LB${i + 1}` });
    }
  }
  for (const mod of BZZ_UK_MODULES) {
    const count = pickCount([[0.5, 1]], 2);
    for (let i = 0; i < count; i++) {
      specs.push({ subject: mod, semester: BZZ_SEMESTER, description: i === 0 ? "ÜK Test" : "ÜK Project" });
    }
  }
  specs.push({ subject: BZZ_IPA, semester: BZZ_SEMESTER, description: "IPA Final", value: 5.0, date: new Date(2026, 0, 15) });
  return specs;
}
