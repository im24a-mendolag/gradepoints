// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import Sidebar from "./Sidebar";
import BottomTabBar from "./BottomTabBar";
import Chip from "./Chip";
import StatsCards from "./StatsCards";
import BzzStatsCards from "./BzzStatsCards";
import { BzzPassFail, OverviewPassFailRules, SemesterPassFailRules } from "./PassFailRules";
import { GradePicker, WeightPicker } from "./GradePickers";
import OverviewCard from "./OverviewCard";
import { useDashboard } from "../DashboardContext";
import { grade } from "../../../../test/fakeApi";
import { renderDashboard } from "../../../../test/renderDashboard";
import { nav, session } from "../../../../test/mocks";

/** Selects semester 3 (a regular tab) so "Dashboard" has somewhere to return to. */
function SemesterTabsProbe() {
  const { selectSemester } = useDashboard();
  return <button onClick={() => selectSemester(3)}>go-3</button>;
}

/** Exposes the active semester so navigation effects can be asserted. */
function ActiveSemester() {
  const { activeSemester } = useDashboard();
  return <output data-testid="sem">{activeSemester}</output>;
}

const press = (key: string, init: KeyboardEventInit = {}, target: Node | Window = window) =>
  fireEvent.keyDown(target, { key, ...init });

describe("Sidebar", () => {
  it("switches views in place on the dashboard, by click and keyboard shortcut", async () => {
    const user = userEvent.setup();
    await renderDashboard(<><Sidebar /><ActiveSemester /><SemesterTabsProbe /></>, { semester: 1 });
    const sem = () => screen.getByTestId("sem").textContent;
    await user.click(screen.getByRole("button", { name: "go-3" }));

    await user.click(screen.getByRole("button", { name: /Overview/ }));
    expect(sem()).toBe("0");
    await user.click(screen.getByRole("button", { name: /Finals/ }));
    expect(sem()).toBe("7");
    await user.click(screen.getByRole("button", { name: /Dashboard/ }));
    expect(sem()).toBe("3");

    press("o");
    expect(sem()).toBe("0");
    press("F");
    expect(sem()).toBe("7");
    press("d");
    expect(sem()).toBe("3");
    press("s");
    expect(nav.router.push).toHaveBeenCalledWith("/dashboard/stats?school=KSH");
    press("e");
    expect(nav.router.push).toHaveBeenCalledWith("/extension");

    // ignored: modifiers, typing in inputs, unknown keys
    press("o", { ctrlKey: true });
    const input = document.createElement("input");
    document.body.appendChild(input);
    press("o", {}, input);
    press("x");
    expect(sem()).toBe("3");

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(session.signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  it("navigates instead when off the dashboard, and hides KSH items for BZZ", async () => {
    nav.pathname = "/dashboard/stats";
    session.data = null;
    await renderDashboard(<Sidebar />, { semester: 1 });
    expect(screen.getByRole("link", { name: /Overview/ }).getAttribute("href")).toBe("/dashboard?school=KSH&tab=0");
    expect(screen.getByText("Account")).toBeTruthy();
    press("o");
    expect(nav.router.push).toHaveBeenCalledWith("/dashboard?school=KSH&tab=0");
    press("f");
    expect(nav.router.push).toHaveBeenCalledWith("/dashboard?school=KSH&tab=7");
    press("d");
    expect(nav.router.push).toHaveBeenCalledWith("/dashboard?school=KSH");

    fireEvent.click(screen.getByRole("button", { name: "BZZ" }));
    expect(screen.queryByText("Overview")).toBeNull();
    nav.router.push.mockClear();
    press("o");
    press("f");
    press("e");
    expect(nav.router.push).not.toHaveBeenCalled();
  });
});

describe("deep-linked semester", () => {
  it("returns to the ?tab= semester after visiting Overview", async () => {
    const user = userEvent.setup();
    await renderDashboard(<><Sidebar /><ActiveSemester /></>, { semester: 3 });
    await user.click(screen.getByRole("button", { name: /Overview/ }));
    expect(screen.getByTestId("sem").textContent).toBe("0");
    await user.click(screen.getByRole("button", { name: /Dashboard/ }));
    expect(screen.getByTestId("sem").textContent).toBe("3");
  });

  it("falls back to semester 1 when the deep link is Overview or Finals", async () => {
    const user = userEvent.setup();
    await renderDashboard(<><Sidebar /><ActiveSemester /></>, { semester: 7 });
    await user.click(screen.getByRole("button", { name: /Dashboard/ }));
    expect(screen.getByTestId("sem").textContent).toBe("1");
  });
});

describe("BottomTabBar", () => {
  it("switches views in place on the dashboard", async () => {
    const user = userEvent.setup();
    await renderDashboard(<><BottomTabBar /><ActiveSemester /><SemesterTabsProbe /></>, { semester: 1 });
    await user.click(screen.getByRole("button", { name: "go-3" }));
    await user.click(screen.getByRole("button", { name: "Overview" }));
    expect(screen.getByTestId("sem").textContent).toBe("0");
    await user.click(screen.getByRole("button", { name: "Finals" }));
    await user.click(screen.getByRole("button", { name: "Grades" }));
    expect(screen.getByTestId("sem").textContent).toBe("3");
  });

  it("links to views from other pages", async () => {
    nav.pathname = "/dashboard/account";
    await renderDashboard(<BottomTabBar />, { school: "BZZ" });
    expect(screen.getByRole("link", { name: "Grades" }).getAttribute("href")).toBe("/dashboard?school=BZZ");
    expect(screen.queryByText("Overview")).toBeNull();
  });
});

describe("StatsCards", () => {
  const grades = [grade({ subject: "Math", value: 3 }), grade({ subject: "Math (Written)", value: 5, semester: 7 })];

  it("shows semester status on regular tabs", async () => {
    await renderDashboard(<StatsCards />, { grades, semester: 1 });
    expect(screen.getByText("Sem 1 avg")).toBeTruthy();
    expect(screen.getByText("Failed")).toBeTruthy();
  });

  it("shows the finals average without a status tile", async () => {
    await renderDashboard(<StatsCards />, { grades, semester: 7 });
    expect(screen.getByText("Finals")).toBeTruthy();
    expect(screen.queryByText("Sem status")).toBeNull();
  });

  it("shows the 3-year result on the overview", async () => {
    await renderDashboard(<StatsCards />, { grades, semester: 0 });
    expect(screen.getByText("Final result")).toBeTruthy();
    expect(screen.getByText("Passed")).toBeTruthy();
  });

  it("shows '—' for an undecided semester", async () => {
    await renderDashboard(<StatsCards />, { semester: 2 });
    expect(screen.getByText("Sem status").nextSibling!.textContent).toBe("—");
  });
});

describe("BZZ summaries", () => {
  it("shows module averages and pass state", async () => {
    await renderDashboard(<><BzzStatsCards /><BzzPassFail /></>, {
      school: "BZZ",
      grades: [grade({ subject: "431", value: 5, school: "BZZ" }), grade({ subject: "187", value: 3.25, school: "BZZ" })],
    });
    expect(screen.getByText("(5.000)")).toBeTruthy();
    expect(screen.getByText("Passed")).toBeTruthy();
    expect(screen.getByText("Pass / Fail — BZZ").className).toContain("text-subject-green");
  });

  it("is undecided without grades", async () => {
    await renderDashboard(<BzzPassFail />, { school: "BZZ" });
    expect(screen.getByText("Pass / Fail — BZZ").className).toContain("text-fg-muted");
  });
});

describe("pass/fail panels", () => {
  it("lists failing subjects and negative points", async () => {
    const user = userEvent.setup();
    await renderDashboard(<SemesterPassFailRules semester={1} />, {
      grades: [grade({ subject: "Math", value: 3 }), grade({ subject: "German", value: 5 })],
    });
    expect(screen.getByText("1 subject")).toBeTruthy();
    expect(screen.getByText("(Math)")).toBeTruthy();
    expect(screen.getByText("1 pt")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Pass \/ Fail/ }));
  });

  it("shows placeholders without data", async () => {
    await renderDashboard(<OverviewPassFailRules />);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});

describe("OverviewCard", () => {
  it("shows the IDPA final for IDAF and a missing final", async () => {
    await renderDashboard(<><OverviewCard subject="IDAF" /><OverviewCard subject="German" /><OverviewCard subject="GuP" /></>, {
      grades: [grade({ subject: "IDAF", value: 4.5, semester: 3 }), grade({ subject: "IDPA", value: 5, semester: 6 })],
    });
    expect(screen.getAllByText("IDPA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Final").length).toBeGreaterThan(0);
    expect(screen.getByText("Sem: 1, 2, 3, 4")).toBeTruthy();
  });
});

describe("Chip", () => {
  it.each(["neutral", "pass", "fail", "now", "ink"] as const)("renders the %s tone", (tone) => {
    render(<Chip tone={tone} mono={tone !== "ink"}>x</Chip>);
    expect(screen.getByText("x").className).toContain(tone === "ink" ? "font-medium" : "font-mono");
  });
});

describe("pickers", () => {
  function Harness({ kind, noSlider, initial }: { kind: "grade" | "weight"; noSlider?: boolean; initial: string }) {
    const [v, setV] = useState(initial);
    const Picker = kind === "grade" ? GradePicker : WeightPicker;
    return <><Picker value={v} onChange={setV} noSlider={noSlider} /><output data-testid="v">{v}</output></>;
  }
  const value = () => screen.getByTestId("v").textContent;

  it("grade picker syncs slider and input", () => {
    render(<Harness kind="grade" initial="" />);
    expect(screen.getByText("—")).toBeTruthy();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "4.5" } });
    expect(value()).toBe("4.5");
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "5" } });
    expect(value()).toBe("5");
  });

  it("grade picker without slider", () => {
    render(<Harness kind="grade" noSlider initial="9" />);
    expect(screen.getByText("—")).toBeTruthy();
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "2" } });
    expect(screen.getAllByText("2")).toHaveLength(2);
  });

  it("weight picker warns on zero and steps within 0–3", async () => {
    const user = userEvent.setup();
    render(<Harness kind="weight" noSlider initial="0.5" />);
    await user.click(screen.getByRole("button", { name: "−" }));
    expect(value()).toBe("0");
    expect(screen.getByText(/won.t count toward averages/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "−" }));
    expect(value()).toBe("0");
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "" } });
    await user.click(screen.getByRole("button", { name: "+" }));
    expect(value()).toBe("1.5");
  });

  it("weight picker with slider", () => {
    render(<Harness kind="weight" initial="abc" />);
    expect(screen.getByText("×1")).toBeTruthy();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "0" } });
    expect(screen.getByText(/won.t count toward averages/)).toBeTruthy();
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "2" } });
    expect(value()).toBe("2");
  });
});

vi.mock("./ThemeToggle", () => ({ default: () => null }));
