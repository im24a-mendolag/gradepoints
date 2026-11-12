"use client";

import { useDashboard } from "../DashboardContext";
import { AvgTile, ResultTile, StatTile, StatTiles } from "./StatsCards";

function RawAvg({ value }: { value: number | null }) {
  if (value === null) return null;
  return <span className="text-[11px] text-fg-faint ml-1">({value.toFixed(3)})</span>;
}

export default function BzzStatsCards() {
  const { getBzzNormalAverage, getBzzNormalRawAverage, getBzzUkAverage, getBzzUkRawAverage, getBzzFinalAverage, getBzzIpaAverage, getBzzPassFail, grades } = useDashboard();
  const passFail = getBzzPassFail();

  return (
    <StatTiles>
      <StatTile label="Total grades">{grades.length}</StatTile>
      <AvgTile label="Normal avg" value={getBzzNormalAverage()} digits={1} extra={<RawAvg value={getBzzNormalRawAverage()} />} />
      <AvgTile label="ÜK avg" value={getBzzUkAverage()} digits={1} extra={<RawAvg value={getBzzUkRawAverage()} />} />
      <AvgTile label="Final avg" value={getBzzFinalAverage()} digits={2} />
      <AvgTile label="IPA" value={getBzzIpaAverage()} digits={2} />
      <ResultTile label="Status" passed={passFail.finalAvg !== null ? passFail.passed : null} />
    </StatTiles>
  );
}
