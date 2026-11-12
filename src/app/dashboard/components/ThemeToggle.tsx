"use client";

import { useSyncExternalStore } from "react";
import Segmented from "./Segmented";
import { getThemePref, setThemePref, subscribeThemePref, type ThemePref } from "@/lib/theme";

/** The server can't see localStorage; render the default and let the client snapshot take over. */
const serverPref = (): ThemePref => "dark";

/** Light / Dark / System segmented control. */
export default function ThemeToggle() {
  const pref = useSyncExternalStore(subscribeThemePref, getThemePref, serverPref);

  return (
    <Segmented<ThemePref>
      size="sm"
      value={pref}
      onChange={setThemePref}
      options={[
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
        { value: "system", label: "System" },
      ]}
    />
  );
}
