"use client";

import { useDashboard } from "../DashboardContext";
import { BZZ_MODULE_NAMES } from "@/lib/semesters";
import GradeCard from "./GradeCard";

export default function BzzModuleCard({ mod }: { mod: string }) {
  const { getBzzModuleGrades, getBzzModuleAverage, getBzzModuleRawAverage, getBzzModuleAdjustment } = useDashboard();

  return (
    <GradeCard
      title={mod}
      subtitle={BZZ_MODULE_NAMES[mod]}
      expandKey={`bzz-${mod}`}
      grades={getBzzModuleGrades(mod)}
      avg={getBzzModuleAverage(mod)}
      rawAvg={getBzzModuleRawAverage(mod)}
      adj={getBzzModuleAdjustment(mod)}
    />
  );
}
