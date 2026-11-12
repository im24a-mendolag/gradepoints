// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddGradePanel from "./AddGradePanel";
import { grade } from "../../../../test/fakeApi";
import { renderDashboard } from "../../../../test/renderDashboard";

const pickSubject = async (user: ReturnType<typeof userEvent.setup>, query: string, option: RegExp) => {
  await user.type(screen.getByPlaceholderText("Select or type subject…"), query);
  fireEvent.mouseDown(screen.getByText(option));
};

describe("AddGradePanel", () => {
  it("adds a KSH grade and resets the form", async () => {
    const user = userEvent.setup();
    const { db } = await renderDashboard(<AddGradePanel />, { semester: 1 });
    const add = screen.getByRole("button", { name: "Add Grade" });
    expect((add as HTMLButtonElement).disabled).toBe(true);

    await pickSubject(user, "math", /^Math – /);
    await user.type(screen.getAllByPlaceholderText("1–6")[0], "5");
    await user.type(screen.getByPlaceholderText("e.g. Midterm exam"), "Quiz{Enter}");
    await waitFor(() => expect(db.grades).toHaveLength(1));
    expect(db.grades[0]).toMatchObject({ subject: "Math", value: 5, semester: 1, description: "Quiz" });
  });

  it("computes the grade from points", async () => {
    const user = userEvent.setup();
    const { db } = await renderDashboard(<AddGradePanel noSlider />, { semester: 1 });
    await pickSubject(user, "Deutsch", /^German – /);
    await user.click(screen.getByRole("button", { name: "Points" }));
    await user.type(screen.getByPlaceholderText("My pts"), "18");
    await user.type(screen.getByPlaceholderText("Max pts"), "20");
    expect(screen.getByText("= 5.500")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Add Grade" }));
    await waitFor(() => expect(db.grades[0]).toMatchObject({ subject: "German", value: 5.5 }));
    await user.click(screen.getByRole("button", { name: "Grade" }));
  });

  it("saves a bonus/malus adjustment for the selected subject", async () => {
    const user = userEvent.setup();
    const { db } = await renderDashboard(<AddGradePanel />, {
      semester: 1,
      adjustments: [{ id: "a1", semester: 1, subject: "Math", value: 0.5, school: "KSH" }],
    });
    await pickSubject(user, "Math", /^Math – /);
    const adj = screen.getByPlaceholderText("±0.0") as HTMLInputElement;
    expect(adj.value).toBe("0.5");
    await user.clear(adj);
    await user.type(adj, "-0.25{Enter}");
    await waitFor(() => expect(db.adjustments[0].value).toBe(-0.25));
    await user.clear(adj);
    await user.tab();
    await waitFor(() => expect(db.adjustments).toHaveLength(0));
  });

  it("imports pasted grades", async () => {
    const user = userEvent.setup();
    const { db } = await renderDashboard(<AddGradePanel />, { semester: 2 });
    await user.click(screen.getByRole("button", { name: "Paste" }));
    await pickSubject(user, "Eng", /^English – /);
    fireEvent.change(document.querySelector("textarea")!, {
      target: { value: "Test 1\t4,5\t15.09.2025\t0,5\nNo date\t5\nbad\t9\njunk\n\nNo weight\t3\t\t" },
    });
    expect(screen.getByText("Import 3 grades")).toBeTruthy();
    expect(screen.getByText("×0.5")).toBeTruthy();
    expect(screen.getByText("2025-09-15")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Import 3 grades" }));
    await waitFor(() => expect(db.grades).toHaveLength(3));
    expect(db.grades[0]).toMatchObject({ subject: "English", value: 4.5, weight: 0.5, semester: 2, date: "2025-09-15" });
  });

  it("imports pasted BZZ grades to the module", async () => {
    const user = userEvent.setup();
    const { db } = await renderDashboard(<AddGradePanel />, { school: "BZZ" });
    await user.click(screen.getByRole("button", { name: "Paste" }));
    await pickSubject(user, "431", /^431 – /);
    fireEvent.change(document.querySelector("textarea")!, { target: { value: "LB1\t5" } });
    await user.click(screen.getByRole("button", { name: "Import 1 grade" }));
    await waitFor(() => expect(db.grades[0]).toMatchObject({ subject: "431", school: "BZZ" }));
  });

  it("shows the grade needed to reach a target average", async () => {
    const user = userEvent.setup();
    await renderDashboard(<AddGradePanel />, {
      semester: 1,
      grades: [grade({ subject: "Math", value: 4 }), grade({ subject: "Math", value: 3 })],
    });
    await user.click(screen.getByRole("button", { name: "Target" }));
    expect(screen.getAllByText("—", { selector: ".font-mono" }).length).toBeGreaterThanOrEqual(2); // no subject yet
    await pickSubject(user, "Math", /^Math – /);
    expect(screen.getByText("3.50")).toBeTruthy(); // current average
    expect(screen.getByText("4.25")).toBeTruthy(); // needed for 4.0 with weight 1

    const target = screen.getAllByRole("spinbutton").find((el) => (el as HTMLInputElement).value === "4")!;
    await user.clear(target);
    await user.type(target, "6.3");
    await user.tab();
    expect((target as HTMLInputElement).value).toBe("6");
    expect(screen.getByText("10.25")).toBeTruthy();

    await user.clear(target);
    await user.type(target, "5.5");
    expect(screen.getByText("8.75")).toBeTruthy(); // out of reach

    await user.click(screen.getByRole("button", { name: "Target" }));
    expect(screen.getByRole("button", { name: "Add Grade" })).toBeTruthy();
  });

  it("clears the selected subject when the query changes", async () => {
    const user = userEvent.setup();
    await renderDashboard(<AddGradePanel />, { semester: 1 });
    await pickSubject(user, "Math", /^Math – /);
    const input = screen.getByPlaceholderText("Select or type subject…");
    await user.type(input, "x");
    expect((screen.getByPlaceholderText("±0.0") as HTMLInputElement).disabled).toBe(true);
    fireEvent.blur(input);
  });
});
