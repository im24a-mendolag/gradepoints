"use client";

import { usePathname } from "next/navigation";

/**
 * Global footer — hidden on the app-shell routes (dashboard/stats/account/extension)
 * where it would otherwise sit below the sticky sidebars and clip their tops on scroll.
 */
export default function SiteFooter() {
  const pathname = usePathname();
  const hide = pathname.startsWith("/dashboard") || pathname.startsWith("/extension");
  if (hide) return null;
  return (
    <footer className="text-center text-xs text-fg-faint py-4">
      © {new Date().getFullYear()} GradePoints. All rights reserved.
    </footer>
  );
}
