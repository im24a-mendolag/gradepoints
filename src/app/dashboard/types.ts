export interface Grade {
  id: string;
  value: number;
  weight: number;
  description: string;
  date: string;
  semester: number;
  subject: string;
}

export interface Adjustment {
  id: string;
  value: number;
  semester: number;
  subject: string;
}

export interface SemesterStatus {
  passed: boolean;
  semAvg: number | null;
  subjectsBelow4: string[];
  subjectsBelow4Count: number;
  negativePoints: number;
  rule1Pass: boolean;
  rule2Pass: boolean;
  rule3Pass: boolean;
}

export interface OverviewStatus {
  passed: boolean;
  avg: number;
  subjectResults: { subject: string; finalGrade: number }[];
  subjectsBelow4: string[];
  subjectsBelow4Count: number;
  negativePoints: number;
  rule1Pass: boolean;
  rule2Pass: boolean;
  rule3Pass: boolean;
}

export interface FinalSubjectGrade {
  semesterAvg: number | null;
  finalsGrade: number | null;
  finalGrade: number | null;
}
