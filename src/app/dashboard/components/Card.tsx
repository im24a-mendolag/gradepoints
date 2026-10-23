import type { HTMLAttributes } from "react";

/**
 * Flat surface card: 1px hairline border, small (6px) radius, no shadow —
 * the calendar-gm card treatment.
 */
export default function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`bg-surface border border-line rounded-card ${className}`}
    />
  );
}
