"use client";

import type { ReactNode } from "react";

export interface SegmentOption<T extends string | number> {
  value: T;
  label: ReactNode;
}

/**
 * Segmented control (sunken track, active segment on a raised surface) — used
 * for school/semester/theme pickers. Mirrors the calendar-gm Day/Week/Month and
 * Light/Dark/System toggles.
 */
export default function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  size = "md",
  className = "",
  fill = false,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
  className?: string;
  fill?: boolean;
}) {
  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-4 py-1.5 text-sm";
  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-card bg-sunken p-0.5 ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={`${pad} ${fill ? "flex-1 justify-center" : ""} inline-flex items-center rounded-control font-medium transition cursor-pointer ${
              active
                ? "bg-surface text-fg shadow-sm"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
