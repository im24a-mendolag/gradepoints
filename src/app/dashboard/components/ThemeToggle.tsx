"use client";

import { useEffect, useState } from "react";
import Segmented from "./Segmented";
import { getThemePref, setThemePref, type ThemePref } from "@/lib/theme";

/** Light / Dark / System segmented control. */
export default function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>("dark");

  useEffect(() => {
    setPref(getThemePref());
  }, []);

  return (
    <Segmented<ThemePref>
      size="sm"
      value={pref}
      onChange={(v) => {
        setPref(v);
        setThemePref(v);
      }}
      options={[
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
        { value: "system", label: "System" },
      ]}
    />
  );
}
