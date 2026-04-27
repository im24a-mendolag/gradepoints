"use client";

import { useState, useEffect } from "react";
import { getGradeColor, blockNonNumericKeys, formatWeight } from "../utils";

export const GRADE_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
export const WEIGHT_VALUES = [0.25, 1/3, 0.5, 2/3, 1, 1.5, 2];

export function calcGradeFromPoints(my: string, total: string): string {
  const m = parseFloat(my);
  const t = parseFloat(total);
  if (isNaN(m) || isNaN(t) || t <= 0) return "";
  return String(Math.round(((m / t) * 5 + 1) * 1000) / 1000);
}

export function GradePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [customInput, setCustomInput] = useState("");
  const parsedCustom = parseFloat(customInput);

  useEffect(() => { if (value === "") setCustomInput(""); }, [value]);

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {GRADE_VALUES.map((v) => {
        const selected = customInput === "" && value === String(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => { onChange(String(v)); setCustomInput(""); }}
            className={`w-10 h-9 rounded-lg text-sm font-bold border transition cursor-pointer select-none
              ${selected
                ? `${getGradeColor(v)} ring-2 ring-blue-400 ring-offset-1 ring-offset-neutral-900`
                : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
              }`}
          >
            {v}
          </button>
        );
      })}
      <input
        type="number"
        min="1"
        max="6"
        step="any"
        value={customInput}
        onChange={(e) => { setCustomInput(e.target.value); onChange(e.target.value); }}
        onKeyDown={(e) => blockNonNumericKeys(e)}
        className={`w-20 px-2 h-9 rounded-lg border text-sm font-bold text-center outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
          ${!isNaN(parsedCustom) && parsedCustom >= 1 && parsedCustom <= 6
            ? `${getGradeColor(parsedCustom)} border-blue-400`
            : "border-neutral-700 bg-neutral-800 text-neutral-300"
          }`}
        placeholder="custom"
      />
    </div>
  );
}

export function WeightPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [customInput, setCustomInput] = useState("");

  useEffect(() => { if (value === "") setCustomInput(""); }, [value]);

  return (
    <div className="flex gap-1.5 flex-wrap">
      {WEIGHT_VALUES.map((w) => {
        const selected = customInput === "" && value === String(w);
        return (
          <button
            key={w}
            type="button"
            onClick={() => { onChange(String(w)); setCustomInput(""); }}
            className={`px-3 h-9 rounded-lg text-sm font-medium border transition cursor-pointer select-none
              ${selected
                ? "bg-blue-600 border-blue-500 text-white"
                : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
              }`}
          >
            ×{formatWeight(w)}
          </button>
        );
      })}
      <input
        type="number"
        min="0"
        max="10"
        step="any"
        value={customInput}
        onChange={(e) => { setCustomInput(e.target.value); onChange(e.target.value); }}
        onKeyDown={(e) => blockNonNumericKeys(e)}
        className="w-20 px-2 h-9 rounded-lg border border-neutral-700 bg-neutral-800 text-sm font-bold text-neutral-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
        placeholder="custom"
      />
    </div>
  );
}
