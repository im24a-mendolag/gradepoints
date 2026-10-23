"use client";

import { useDashboard } from "../DashboardContext";
import type { School } from "../types";
import Segmented from "./Segmented";

export default function SchoolSelector({ fill = false }: { fill?: boolean }) {
  const { activeSchool, setActiveSchool } = useDashboard();
  return (
    <Segmented<School>
      size="sm"
      fill={fill}
      value={activeSchool}
      onChange={setActiveSchool}
      options={[
        { value: "KSH", label: "KSH" },
        { value: "BZZ", label: "BZZ" },
      ]}
    />
  );
}
