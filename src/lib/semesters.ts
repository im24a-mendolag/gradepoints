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

export function getSubjectsForSemester(semester: number): string[] {
  if (semester === FINALS_SEMESTER) {
    return [...FINALS_SUBJECT_KEYS];
  }
  return SEMESTER_SUBJECTS[semester] ?? [];
}

export function isValidSubjectForSemester(semester: number, subject: string): boolean {
  return getSubjectsForSemester(semester).includes(subject);
}
