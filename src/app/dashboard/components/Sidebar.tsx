"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { OVERVIEW_TAB, FINALS_SEMESTER } from "@/lib/semesters";
import { useDashboard } from "../DashboardContext";
import SchoolSelector from "./SchoolSelector";
import {
  IconDashboard,
  IconStats,
  IconOverview,
  IconFinals,
  IconExtension,
  IconUser,
} from "./Icons";

function NavItem({
  icon,
  label,
  shortcut,
  active,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const cls = `flex items-center gap-2.5 w-full px-2.5 py-2 rounded-control text-sm transition cursor-pointer ${
    active ? "bg-hover text-fg font-medium" : "text-fg-muted hover:text-fg hover:bg-hover/60"
  }`;
  const inner = (
    <>
      <span className={active ? "text-fg" : "text-fg-faint"}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <span className="text-[11px] font-mono text-fg-faint">{shortcut}</span>}
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** Desktop left navigation rail (calendar-gm style). Hidden below `lg`. */
export default function Sidebar() {
  const { data: session } = useSession();
  const { activeSchool, activeSemester, lastRegularSemester, selectSemester } = useDashboard();
  const pathname = usePathname();
  const router = useRouter();
  const onDashboard = pathname === "/dashboard";

  const isRegular = activeSemester !== OVERVIEW_TAB && activeSemester !== FINALS_SEMESTER;

  // Keyboard shortcuts (the hints shown next to each nav item).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const goView = (sem: number, href: string) => {
        if (onDashboard) selectSemester(sem);
        else router.push(href);
      };
      switch (e.key.toLowerCase()) {
        case "d": goView(lastRegularSemester, `/dashboard?school=${activeSchool}`); break;
        case "s": router.push(`/dashboard/stats?school=${activeSchool}`); break;
        case "o": if (activeSchool === "KSH") goView(OVERVIEW_TAB, `/dashboard?school=KSH&tab=${OVERVIEW_TAB}`); break;
        case "f": if (activeSchool === "KSH") goView(FINALS_SEMESTER, `/dashboard?school=${activeSchool}&tab=${FINALS_SEMESTER}`); break;
        case "e": if (activeSchool === "KSH") router.push("/extension"); break;
        default: return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onDashboard, activeSchool, lastRegularSemester, selectSemester, router]);

  // On the dashboard these switch the active view in place; elsewhere they navigate to it.
  const viewItem = (semProps: { active: boolean; onClick: () => void; href: string }) =>
    onDashboard ? { active: semProps.active, onClick: semProps.onClick } : { href: semProps.href };

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r border-line px-4 py-5 bg-canvas">
      <Link href="/dashboard" className="flex items-center gap-1.5 px-2 pb-4">
        <span className="text-base font-semibold text-fg">GradePoints</span>
      </Link>

      <nav className="flex flex-col gap-0.5">
        <NavItem
          icon={<IconDashboard />}
          label="Dashboard"
          shortcut="D"
          {...viewItem({ active: onDashboard && isRegular, onClick: () => selectSemester(lastRegularSemester), href: `/dashboard?school=${activeSchool}` })}
        />
        <NavItem
          icon={<IconStats />}
          label="Statistics"
          shortcut="S"
          active={pathname.startsWith("/dashboard/stats")}
          href={`/dashboard/stats?school=${activeSchool}`}
        />
        {activeSchool === "KSH" && (
          <>
            <NavItem
              icon={<IconOverview />}
              label="Overview"
              shortcut="O"
              {...viewItem({ active: onDashboard && activeSemester === OVERVIEW_TAB, onClick: () => selectSemester(OVERVIEW_TAB), href: `/dashboard?school=KSH&tab=${OVERVIEW_TAB}` })}
            />
            <NavItem
              icon={<IconFinals />}
              label="Finals"
              shortcut="F"
              {...viewItem({ active: onDashboard && activeSemester === FINALS_SEMESTER, onClick: () => selectSemester(FINALS_SEMESTER), href: `/dashboard?school=${activeSchool}&tab=${FINALS_SEMESTER}` })}
            />
            <NavItem icon={<IconExtension />} label="Extension" shortcut="E" active={pathname.startsWith("/extension")} href="/extension" />
          </>
        )}
      </nav>

      <div className="flex-1" />

      <div className="flex flex-col gap-3">
        <SchoolSelector fill />
        <Link
          href="/dashboard/account"
          className="flex items-center gap-2.5 px-1 py-1 rounded-control text-fg-muted hover:text-fg transition group"
        >
          <span className="w-7 h-7 rounded-full bg-hover flex items-center justify-center text-fg-faint group-hover:text-fg">
            <IconUser size={15} />
          </span>
          <span className="text-sm truncate flex-1">{session?.user?.name ?? "Account"}</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-left px-1 text-xs text-fg-faint hover:text-now transition cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
