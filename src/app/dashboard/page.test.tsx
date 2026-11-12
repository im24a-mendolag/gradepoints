// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "./page";
import { grade, installFakeApi, json } from "../../../test/fakeApi";
import { flush } from "../../../test/renderDashboard";
import { nav } from "../../../test/mocks";

const kshGrades = () => [
  grade({ id: "m1", subject: "Math", value: 5, semester: 1, description: "Algebra test" }),
  grade({ id: "m2", subject: "Math", value: 4, semester: 1, weight: 2 }),
  grade({ id: "g1", subject: "German", value: 3.5, semester: 2 }),
  grade({ id: "f1", subject: "German (Oral)", value: 5, semester: 7 }),
];

async function renderPage(opts: { grades?: ReturnType<typeof kshGrades>; params?: string } = {}, override?: Parameters<typeof installFakeApi>[1]) {
  nav.searchParams = new URLSearchParams(opts.params ?? "");
  const api = installFakeApi({ grades: opts.grades ?? kshGrades() }, override);
  render(<DashboardPage />);
  await screen.findAllByText(/grades/i);
  await flush();
  return api;
}

const card = (title: string) => screen.getAllByRole("heading", { name: title })[0].closest(".rounded-card") as HTMLElement;

describe("DashboardPage (KSH)", () => {
  it("opens on the latest semester with grades and shows its subjects", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Grades" })).toBeTruthy();
    expect(screen.getByText(/Semester 2 · 1 grades/)).toBeTruthy();
    expect(screen.getAllByText("Pass / Fail — Semester 2").length).toBeGreaterThan(0);
  });

  it("expands a subject, edits a grade and undoes the edit", async () => {
    const user = userEvent.setup();
    const { db } = await renderPage({ params: "tab=1" });

    await user.click(within(card("Math")).getAllByRole("button")[0]);
    expect(screen.getByText("Algebra test")).toBeTruthy();

    await user.click(within(card("Math")).getAllByRole("button", { name: "Edit" })[0]);
    const value = within(card("Math")).getByPlaceholderText("1–6");
    await user.clear(value);
    await user.type(value, "5.5");
    await user.click(within(card("Math")).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(db.grades.find((g) => g.id === "m1")!.value).toBe(5.5));

    await user.click(await screen.findByRole("button", { name: "Undo" }));
    await waitFor(() => expect(db.grades.find((g) => g.id === "m1")!.value).toBe(5));
  });

  it("cancels editing and deletes a grade with undo", async () => {
    const user = userEvent.setup();
    const { db } = await renderPage({ params: "tab=1" });
    await user.click(within(card("Math")).getAllByRole("button")[0]);

    await user.click(within(card("Math")).getAllByRole("button", { name: "Edit" })[0]);
    await user.click(within(card("Math")).getByRole("button", { name: "Cancel" }));
    expect(within(card("Math")).queryByRole("button", { name: "Save" })).toBeNull();

    await user.click(within(card("Math")).getAllByRole("button", { name: "Delete" })[0]);
    await waitFor(() => expect(db.grades.some((g) => g.id === "m1")).toBe(false));
    expect(await screen.findByText("Grade deleted")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() => expect(db.grades.filter((g) => g.subject === "Math")).toHaveLength(2));

    await user.click(within(card("Math")).getAllByRole("button", { name: "Delete" })[0]);
    await user.click(await screen.findByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("clears a semester after confirmation, then restores it with undo", async () => {
    const user = userEvent.setup();
    const { db } = await renderPage({ params: "tab=1" });

    await user.click(screen.getByRole("button", { name: "Remove all grades from this semester" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Remove all grades from this semester" }));
    expect(screen.getByText("Delete all 2 grades from semester 1?")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(db.grades.filter((g) => g.semester === 1)).toHaveLength(0));

    await user.click(await screen.findByRole("button", { name: "Undo" }));
    await waitFor(() => expect(db.grades.filter((g) => g.semester === 1)).toHaveLength(2));
  });

  it("shows API errors in a dismissable banner", async () => {
    const user = userEvent.setup();
    await renderPage({ params: "tab=1" }, ({ method }) =>
      method === "DELETE" ? json({ error: "Server said no" }, 500) : undefined,
    );
    await user.click(within(card("Math")).getAllByRole("button")[0]);
    await user.click(within(card("Math")).getAllByRole("button", { name: "Delete" })[0]);
    expect(await screen.findByText("Server said no")).toBeTruthy();
    await user.click(screen.getAllByRole("button", { name: "Dismiss" })[0]);
    expect(screen.queryByText("Server said no")).toBeNull();
  });

  it("switches between semester tabs, overview and finals", async () => {
    const user = userEvent.setup();
    const { db } = await renderPage({ params: "tab=1" });

    await user.click(screen.getByText("Semester 3"));
    expect(screen.getByText(/Semester 3 · 0 grades/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Remove all grades from this semester" })).toBeNull();

    await user.click(screen.getAllByRole("button", { name: /Finals/ })[0]);
    expect(screen.getByRole("heading", { level: 1, name: "Finals" })).toBeTruthy();
    const oral = screen.getAllByPlaceholderText("1–6")[0] as HTMLInputElement;
    expect(oral.value).toBe("5");
    const written = screen.getAllByPlaceholderText("1–6")[1];
    await user.type(written, "4{Enter}");
    await waitFor(() => expect(db.grades.some((g) => g.subject === "German (Written)")).toBe(true));
    await user.clear(oral);
    await user.type(oral, "6");
    await user.tab();
    await waitFor(() => expect(db.grades.find((g) => g.id === "f1")!.value).toBe(6));
    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    await waitFor(() => expect(db.grades.some((g) => g.id === "f1")).toBe(false));

    await user.click(screen.getAllByRole("button", { name: /Overview/ })[0]);
    expect(screen.getByText("Three-year final results")).toBeTruthy();
    expect(screen.getAllByText("Pass / Fail — 3-Year Final").length).toBeGreaterThan(0);
  });

  it("opens and closes the mobile add sheet", async () => {
    const user = userEvent.setup();
    await renderPage({ params: "tab=1" });
    await user.click(screen.getByRole("button", { name: "Add grade" }));
    expect(screen.getByText("Add Grade", { selector: "span" })).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(document.body.style.overflow).toBe("");
  });
});

describe("DashboardPage (BZZ)", () => {
  it("lists module sections and switches back to KSH", async () => {
    const user = userEvent.setup();
    await renderPage({
      params: "school=BZZ",
      grades: [grade({ subject: "431", value: 5, school: "BZZ" }), grade({ subject: "IPA", value: 3, school: "BZZ" })],
    });
    expect(screen.getByRole("heading", { level: 1, name: "Modules" })).toBeTruthy();
    expect(screen.getByText("BZZ · 2 grades")).toBeTruthy();
    expect(screen.getAllByText("Pass / Fail — BZZ").length).toBeGreaterThan(0);
    expect(screen.getByText("Normal Modules")).toBeTruthy();

    await user.click(screen.getAllByRole("button", { name: "KSH" })[0]);
    expect(screen.getByRole("heading", { level: 1, name: "Grades" })).toBeTruthy();
  });

  it("shows a spinner until data has loaded", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    installFakeApi({}, () => undefined);
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const real = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (...args: Parameters<typeof fetch>) => {
      await gate;
      return real(...args);
    });
    const { container } = render(<DashboardPage />);
    expect(container.querySelector(".animate-spin")).toBeTruthy();
    release();
    await screen.findByRole("heading", { level: 1 });
  });
});
