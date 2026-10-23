"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OVERVIEW_TAB, FINALS_SEMESTER } from "@/lib/semesters";
import { useDashboard } from "../DashboardContext";
import { IconDashboard, IconStats, IconOverview, IconFinals, IconUser } from "./Icons";

function Tab({
  icon,
  label,
  active,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const cls = `flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-[10px] transition cursor-pointer ${
    active ? "text-fg" : "text-fg-faint"
  }`;
  const inner = (
    <>
      {icon}
      <span>{label}</span>
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

/** Mobile bottom navigation. Hidden at `lg` and up. */
export default function BottomTabBar() {
  const { activeSchool, activeSemester, lastRegularSemester, selectSemester } = useDashboard();
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";
  const isRegular = activeSemester !== OVERVIEW_TAB && activeSemester !== FINALS_SEMESTER;

  // In place on the dashboard; navigate to it from elsewhere.
  const viewTab = (semProps: { active: boolean; onClick: () => void; href: string }) =>
    onDashboard ? { active: semProps.active, onClick: semProps.onClick } : { href: semProps.href };

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch border-t border-line bg-surface/95 backdrop-blur px-2"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <Tab
        icon={<IconDashboard size={20} />}
        label="Grades"
        {...viewTab({ active: onDashboard && isRegular, onClick: () => selectSemester(lastRegularSemester), href: `/dashboard?school=${activeSchool}` })}
      />
      <Tab icon={<IconStats size={20} />} label="Stats" active={pathname.startsWith("/dashboard/stats")} href={`/dashboard/stats?school=${activeSchool}`} />
      {activeSchool === "KSH" && (
        <>
          <Tab
            icon={<IconOverview size={20} />}
            label="Overview"
            {...viewTab({ active: onDashboard && activeSemester === OVERVIEW_TAB, onClick: () => selectSemester(OVERVIEW_TAB), href: `/dashboard?school=KSH&tab=${OVERVIEW_TAB}` })}
          />
          <Tab
            icon={<IconFinals size={20} />}
            label="Finals"
            {...viewTab({ active: onDashboard && activeSemester === FINALS_SEMESTER, onClick: () => selectSemester(FINALS_SEMESTER), href: `/dashboard?school=${activeSchool}&tab=${FINALS_SEMESTER}` })}
          />
        </>
      )}
      <Tab icon={<IconUser size={20} />} label="Account" href="/dashboard/account" active={pathname.startsWith("/dashboard/account")} />
    </nav>
  );
}
