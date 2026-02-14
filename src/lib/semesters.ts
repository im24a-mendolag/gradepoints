export const SUBJECTS = [
  "German",
  "French",
  "English",
  "Math",
  "WR",
  "FrW",
  "History",
  "Science",
  "IDAF",
  "IDPA",
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const SEMESTER_SUBJECTS: Record<number, Subject[]> = {
  1: ["German", "French", "English", "Math", "WR", "FrW", "History"],
  2: ["German", "French", "English", "Math", "WR", "FrW", "History"],
  3: ["German", "French", "English", "Math", "WR", "FrW", "History", "Science", "IDAF"],
  4: ["German", "French", "English", "Math", "WR", "FrW", "History", "Science", "IDAF"],
  5: ["German", "French", "English", "Math", "WR", "FrW", "Science"],
  6: ["German", "French", "English", "Math", "WR", "FrW", "Science", "IDPA"],
};

export const TOTAL_SEMESTERS = 6;

// Finals use semester = 7 internally
export const FINALS_SEMESTER = 7;

// Overview tab uses 0
export const OVERVIEW_TAB = 0;

// Mapping from base subject to finals entries
export const FINALS_ENTRIES: Record<string, string[]> = {
  German: ["German (Oral)", "German (Written)"],
  French: ["French (Oral)", "French (Written)"],
  English: ["English (Oral)", "English (Written)"],
  Math: ["Math (Written)"],
  WR: ["WR (Written)"],
  FrW: ["FrW (Written)"],
};

// All subjects that appear across any semester
export const ALL_SUBJECTS = SUBJECTS as readonly string[];

// IDPA acts as the "final" for IDAF in the overview
export const IDPA_FINAL_FOR_IDAF = {
  subject: "IDAF",     // The subject that IDPA is the final for
  finalSubject: "IDPA", // The subject whose grades are used as the "final"
  finalSemester: 6,     // The semester where IDPA grades live
} as const;

// Subjects to show in the Overview tab (IDPA is excluded since it's consumed by IDAF)
export const OVERVIEW_SUBJECTS = SUBJECTS.filter((s) => s !== "IDPA") as readonly string[];

// Subjects that have finals exams
export const FINALS_SUBJECTS = ["German", "French", "English", "Math", "WR", "FrW"] as const;

// Subjects where the final is split into oral and written
export const FINALS_ORAL_WRITTEN = ["German", "French", "English"] as const;

// All valid finals subject keys (used for storage)
export const FINALS_SUBJECT_KEYS = [
  "German (Oral)", "German (Written)",
  "French (Oral)", "French (Written)",
  "English (Oral)", "English (Written)",
  "Math (Written)", "WR (Written)", "FrW (Written)",
] as const;

// ─── BZZ Configuration ──────────────────────────────────────────

export const BZZ_SEMESTER = 1; // BZZ uses a single flat "semester" internally

export const BZZ_NORMAL_MODULES = [
  "431", "117", "319", "162", "114", "164", "293", "231",
  "320", "165", "322", "122", "254", "346", "426", "347",
  "323", "450", "306", "183", "324", "321", "241", "245",
] as const;

export const BZZ_UK_MODULES = [
  "187", "106", "294", "295", "210", "335", "223",
] as const;

export const BZZ_IPA = "IPA" as const;

export const BZZ_ALL_MODULES = [
  ...BZZ_NORMAL_MODULES,
  ...BZZ_UK_MODULES,
  BZZ_IPA,
] as const;

export type BzzModule = (typeof BZZ_ALL_MODULES)[number];

export function isBzzModule(subject: string): boolean {
  return (BZZ_ALL_MODULES as readonly string[]).includes(subject);
}

// ─── Shared helpers ─────────────────────────────────────────────

export function getSubjectsForSemester(semester: number): string[] {
  if (semester === FINALS_SEMESTER) {
    return [...FINALS_SUBJECT_KEYS];
  }
  return SEMESTER_SUBJECTS[semester] ?? [];
}

export function isValidSubjectForSemester(semester: number, subject: string): boolean {
  return getSubjectsForSemester(semester).includes(subject);
}

export function isValidBzzSubject(subject: string): boolean {
  return (BZZ_ALL_MODULES as readonly string[]).includes(subject);
}
