"use client";

import { useState } from "react";
import { IconChevron } from "./Icons";

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
        <h2 className="text-[11px] font-semibold tracking-wide uppercase text-fg-faint group-hover:text-fg transition">
          {title}
        </h2>
        <IconChevron
          size={13}
          className={`text-fg-faint group-hover:text-fg transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && <div className="space-y-2.5">{children}</div>}
    </div>
  );
}
