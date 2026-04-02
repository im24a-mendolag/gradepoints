import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "dangerFilled";
type Size = "sm" | "md";

const base = "inline-flex items-center justify-center font-medium rounded-lg transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:        "bg-blue-600 hover:bg-blue-500 text-white border-transparent",
  secondary:      "border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-neutral-200",
  danger:         "border border-red-900 hover:border-red-700 text-red-500 hover:text-red-400",
  dangerFilled:   "bg-red-600 hover:bg-red-500 text-white border-transparent",
};

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs rounded-md",
  md: "px-4 py-2 text-sm",
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
