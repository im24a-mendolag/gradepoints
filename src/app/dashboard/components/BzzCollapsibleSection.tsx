"use client";

import { useState } from "react";

export default function BzzCollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
        className="flex items-center gap-2 mb-3 cursor-pointer group"
      >
        <h2 className="text-lg font-semibold text-neutral-100 group-hover:text-neutral-300 transition">
          {title}
        </h2>
        <span
          className={`text-neutral-500 group-hover:text-neutral-300 transition-transform inline-block ${
            open ? "rotate-90" : ""
          }`}
        >
          ▶
        </span>
      </button>
      {open && <div className="space-y-4">{children}</div>}
    </div>
  );
}
