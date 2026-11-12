const SUBJECTS = [
  "German",
  "French",
  "English",
  "Math",
  "WR",
  "FrW",
  "GuP",
  "TuU",
  "IDAF",
  "IDPA",
  "PrWr",
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const SEMESTER_SUBJECTS: Record<number, Subject[]> = {
  1: ["German", "French", "English", "Math", "WR", "FrW", "GuP"],
  2: ["German", "French", "English", "Math", "WR", "FrW", "GuP"],
  3: ["German", "French", "English", "Math", "WR", "FrW", "GuP", "TuU", "IDAF", "PrWr"],
  4: ["German", "French", "English", "Math", "WR", "FrW", "GuP", "TuU", "IDAF", "PrWr"],
  5: ["German", "French", "English", "Math", "WR", "FrW", "TuU"],
  6: ["German", "French", "English", "Math", "WR", "FrW", "TuU", "IDPA"],
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

// IDPA acts as the "final" for IDAF in the overview
export const IDPA_FINAL_FOR_IDAF = {
  subject: "IDAF",     // The subject that IDPA is the final for
  finalSubject: "IDPA", // The subject whose grades are used as the "final"
  finalSemester: 6,     // The semester where IDPA grades live
} as const;

// Subjects to show in the Overview tab (IDPA is excluded since it's consumed by IDAF)
export const OVERVIEW_SUBJECTS = SUBJECTS.filter((s) => s !== "IDPA") as readonly string[];

// All valid finals subject keys (used for storage)
const FINALS_SUBJECT_KEYS = [
  "German (Oral)", "German (Written)",
  "French (Oral)", "French (Written)",
  "English (Oral)", "English (Written)",
  "Math (Written)", "WR (Written)", "FrW (Written)",
] as const;

// ─── KSH Configuration ──────────────────────────────────────────

export const KSH_SUBJECT_NAMES: Record<string, string> = {
  "German":  "Deutsch",
  "French":  "Französisch",
  "English": "Englisch",
  "Math":    "Mathematik",
  "WR":      "Wirtschaft und Recht",
  "FrW":     "Finanz und Rechnungswesen",
  "GuP": "Geschichte und Politik",
  "TuU": "Technik und Umwelt",
  "IDAF":    "Interdisziplinäres Arbeiten in den Fächern",
  "IDPA":    "Interdisziplinäre Projektarbeit",
  "PrWr":    "Projekt Wirtschaft",
};

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

export const BZZ_MODULE_NAMES: Record<string, string> = {
  "106": "Datenbanken abfragen, bearbeiten und warten",
  "114": "Codierungs-, Kompressions- und Verschlüsselungsverfahren einsetzen",
  "117": "Informatik- und Netzinfrastruktur für ein kleines Unternehmen realisieren",
  "122": "Abläufe mit einer Scriptsprache automatisieren",
  "162": "Daten analysieren und modellieren",
  "164": "Datenbanken erstellen und Daten einfügen",
  "165": "NoSQL-Datenbanken einsetzen",
  "183": "Applikationssicherheit implementieren",
  "187": "ICT-Benutzerendgeräte und Arbeitsplatz in Betrieb nehmen",
  "210": "Public Cloud für Anwendungen nutzen",
  "223": "Multi-User-Applikationen objektorientiert realisieren",
  "231": "Datenschutz und Datensicherheit anwenden",
  "241": "Innovative ICT-Lösungen initialisieren",
  "245": "Innovative ICT-Lösungen umsetzen",
  "254": "Geschäftsprozesse im eigenen Berufsumfeld beschreiben",
  "293": "Webauftritt erstellen und veröffentlichen",
  "294": "Frontend einer interaktiven Webapplikation realisieren",
  "295": "Backend für Applikationen realisieren",
  "306": "Kleinprojekte im eigenen Berufsumfeld abwickeln",
  "319": "Applikationen entwerfen und implementieren",
  "320": "Objektorientiert programmieren",
  "321": "Verteilte Systeme programmieren",
  "322": "Benutzerschnittstellen entwerfen und implementieren",
  "323": "Funktional Programmieren",
  "324": "DevOps-Prozesse mit Tools unterstützen",
  "335": "Mobile-Applikation realisieren",
  "346": "Cloud Lösungen konzipieren und realisieren",
  "347": "Dienst mit Container anwenden",
  "426": "Software mit agilen Methoden entwickeln",
  "431": "Aufträge im eigenen Berufsumfeld selbstständig durchführen",
  "450": "Applikationen testen",
  "IPA": "Individuelle Praktische Arbeit",
};

const BZZ_ALL_MODULES = [
  ...BZZ_NORMAL_MODULES,
  ...BZZ_UK_MODULES,
  BZZ_IPA,
] as const;

// ─── Shared helpers ─────────────────────────────────────────────

function getSubjectsForSemester(semester: number): string[] {
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
