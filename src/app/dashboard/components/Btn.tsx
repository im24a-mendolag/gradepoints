import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "dangerFilled";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 font-medium rounded-control transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  // single black "ink" accent
  primary: "bg-ink text-on-ink hover:opacity-90 border border-transparent",
  secondary:
    "border border-line-strong text-fg-muted hover:text-fg hover:bg-hover",
  // red reserved for destructive / urgent
  danger: "border border-line-strong text-now hover:bg-now-tint",
  dangerFilled: "bg-now text-on-solid hover:opacity-90 border border-transparent",
};

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3.5 py-2 text-sm",
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export default function Btn({ variant = "secondary", size = "md", className = "", ...props }: BtnProps) {
  return (
    <button
      {...props}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    />
  );
}
