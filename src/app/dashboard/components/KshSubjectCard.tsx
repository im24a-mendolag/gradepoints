"use client";

import { useDashboard } from "../DashboardContext";
import { KSH_SUBJECT_NAMES } from "@/lib/semesters";
import GradeCard from "./GradeCard";

export default function KshSubjectCard({ subject }: { subject: string }) {
  const { activeSemester, getGradesForSubject, getSubjectAverage, getRawSubjectAverage, getAdjustment } = useDashboard();

  return (
    <GradeCard
      title={subject}
      subtitle={KSH_SUBJECT_NAMES[subject]}
      expandKey={subject}
      grades={getGradesForSubject(activeSemester, subject)}
      avg={getSubjectAverage(activeSemester, subject)}
      rawAvg={getRawSubjectAverage(activeSemester, subject)}
      adj={getAdjustment(activeSemester, subject)}
    />
  );
}
