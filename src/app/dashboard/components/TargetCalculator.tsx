"use client";

import { getGradeColor, blockNonNumericKeys } from "../utils";
import Btn from "./Btn";

interface Props {
  grades: { value: number; weight: number }[];
  targetAvg: string;
  targetWeight: string;
  onTargetAvgChange: (v: string) => void;
  onTargetWeightChange: (v: string) => void;
  onClose: () => void;
}

export default function TargetCalculator({ grades, targetAvg, targetWeight, onTargetAvgChange, onTargetWeightChange, onClose }: Props) {
  const activeGrades = grades.filter((g) => g.weight > 0);
  const weightedSum = activeGrades.reduce((acc, g) => acc + g.value * g.weight, 0);
  const totalWeight = activeGrades.reduce((acc, g) => acc + g.weight, 0);
  const parsedTarget = parseFloat(targetAvg);
  const parsedWeight = parseFloat(targetWeight);
  const needed = !isNaN(parsedTarget) && !isNaN(parsedWeight) && parsedWeight > 0
    ? (parsedTarget * (totalWeight + parsedWeight) - weightedSum) / parsedWeight
    : null;
  const clamped = needed !== null ? Math.min(6, Math.max(1, needed)) : null;
  const impossible = needed !== null && (needed < 1 || needed > 6);

  return (
    <div className="px-4 sm:px-6 py-4 bg-neutral-800/40 border-b border-neutral-700">
      <p className="text-xs font-medium text-neutral-400 mb-3">What grade do you need?</p>
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-neutral-500 mb-1.5">Target average</label>
          <input
            type="number"
            min="1"
            max="6"
            step="any"
            value={targetAvg}
            onChange={(e) => onTargetAvgChange(e.target.value)}
            onKeyDown={(e) => blockNonNumericKeys(e)}
            className="w-24 px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
            placeholder="e.g. 5"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1.5">Weight of new grade</label>
          <input
            type="number"
            min="0"
            step="any"
            value={targetWeight}
            onChange={(e) => onTargetWeightChange(e.target.value)}
            onKeyDown={(e) => blockNonNumericKeys(e)}
            className="w-24 px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
          />
        </div>
        {needed !== null && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center justify-center px-2 h-10 rounded-lg font-bold text-sm border ${impossible ? "border-red-800 bg-red-900/30 text-red-400" : getGradeColor(clamped!)}`}>
              {needed.toFixed(2)}
            </span>
            {impossible && (
              <span className="text-xs text-red-400">
                {needed > 6 ? "Not achievable" : "Already achieved"}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="mt-3">
        <Btn size="sm" onClick={onClose}>Close</Btn>
      </div>
    </div>
  );
}
