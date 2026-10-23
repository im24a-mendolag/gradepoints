import type { ReactNode } from "react";

type Tone = "neutral" | "pass" | "fail" | "now" | "ink";

const tones: Record<Tone, string> = {
  neutral: "bg-hover text-fg-muted",
  pass: "text-subject-green",
  fail: "text-now",
  now: "text-now",
  ink: "bg-ink text-on-ink",
};

/**
 * Small label chip used for counts, status, and adjustments — mono, uppercase-ish,
 * tinted background. Matches the calendar-gm "in 2 days" / tag treatment.
 */
export default function Chip({
  children,
  tone = "neutral",
  mono = true,
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  mono?: boolean;
  className?: string;
}) {
  const tint = tone === "pass" ? "bg-subject-green/10" : tone === "fail" || tone === "now" ? "bg-now-tint" : "";
  return (
    <span
      className={`inline-flex items-center rounded-control px-2 py-0.5 text-[11px] leading-none ${
        mono ? "font-mono" : "font-medium"
      } ${tones[tone]} ${tint} ${className}`}
    >
      {children}
    </span>
  );
}
