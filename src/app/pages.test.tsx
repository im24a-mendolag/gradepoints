// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountPage from "./dashboard/account/page";
import StatsPage from "./dashboard/stats/page";
import LoginPage from "./login/page";
import RegisterPage from "./register/page";
import { grade, installFakeApi, json } from "../../test/fakeApi";
import { flush } from "../../test/renderDashboard";
import { nav, session } from "../../test/mocks";

vi.mock("./dashboard/components/ThemeToggle", () => ({ default: () => <span>theme</span> }));

const lastCall = (fetchMock: ReturnType<typeof installFakeApi>["fetchMock"], url: string) => {
  const call = fetchMock.mock.calls.filter(([u]) => u === url).at(-1)!;
  return { method: call[1]?.method, body: JSON.parse(String(call[1]?.body)) };
};

describe("AccountPage", () => {
  async function renderAccount(override?: Parameters<typeof installFakeApi>[1]) {
    const api = installFakeApi({}, override);
    render(<AccountPage />);
    await flush();
    return api;
  }

  it("renames the user and refreshes the session", async () => {
    const user = userEvent.setup();
    const { fetchMock } = await renderAccount();
    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "   ");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Name cannot be empty")).toBeTruthy();

    await user.clear(name);
    await user.type(name, "Renamed");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Name updated successfully")).toBeTruthy();
    expect(lastCall(fetchMock, "/api/account")).toEqual({ method: "PUT", body: { name: "Renamed" } });
    expect(session.update).toHaveBeenCalledWith({ name: "Renamed" });
  });

  it("validates and changes the password", async () => {
    const user = userEvent.setup();
    const { fetchMock } = await renderAccount();
    const fill = async (current: string, next: string, confirm: string) => {
      for (const [label, v] of [["Current Password", current], ["New Password", next], ["Confirm New Password", confirm]]) {
        await user.clear(screen.getByLabelText(label));
        await user.type(screen.getByLabelText(label), v);
      }
      await user.click(screen.getByRole("button", { name: "Update Password" }));
    };
    await fill("old", "abcdef", "abcdeX");
    expect(screen.getByText("New passwords do not match")).toBeTruthy();
    await fill("old", "abc", "abc");
    expect(screen.getByText("New password must be at least 6 characters")).toBeTruthy();
    await fill("old", "abcdef", "abcdef");
    expect(await screen.findByText("Password updated successfully")).toBeTruthy();
    expect(lastCall(fetchMock, "/api/account").body).toEqual({ currentPassword: "old", newPassword: "abcdef" });
    expect((screen.getByLabelText("Current Password") as HTMLInputElement).value).toBe("");
  });

  it("shows API errors and network failures", async () => {
    const user = userEvent.setup();
    let fail: "api" | "network" = "api";
    await renderAccount(({ url }) => {
      if (url !== "/api/account") return undefined;
      if (fail === "network") throw new Error("offline");
      return json({ error: "Current password is incorrect" }, 403);
    });
    for (const label of ["Current Password", "New Password", "Confirm New Password"]) {
      await user.type(screen.getByLabelText(label), "abcdef");
    }
    await user.click(screen.getByRole("button", { name: "Update Password" }));
    expect(await screen.findByText("Current password is incorrect")).toBeTruthy();
    fail = "network";
    await user.click(screen.getByRole("button", { name: "Update Password" }));
    expect(await screen.findByText("Something went wrong")).toBeTruthy();
  });

  it("deletes the account after confirmation", async () => {
    const user = userEvent.setup();
    const { fetchMock } = await renderAccount();
    await user.click(screen.getByRole("button", { name: "Delete Account" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Delete Account" }));
    await user.type(screen.getByLabelText("Enter your password to confirm"), "pw");
    await user.click(screen.getByRole("button", { name: "Confirm Delete" }));
    await waitFor(() => expect(session.signOut).toHaveBeenCalledWith({ callbackUrl: "/" }));
    expect(lastCall(fetchMock, "/api/account")).toEqual({ method: "DELETE", body: { password: "pw" } });
  });
});

describe("StatsPage", () => {
  async function renderStats(params: string, grades: ReturnType<typeof grade>[]) {
    nav.pathname = "/dashboard/stats";
    nav.searchParams = new URLSearchParams(params);
    installFakeApi({ grades });
    render(<StatsPage />);
    await screen.findByRole("heading", { name: "Statistics" });
    await flush();
  }

  it("shows KSH statistics", async () => {
    const user = userEvent.setup();
    await renderStats("", [
      grade({ subject: "Math", value: 5 }),
      grade({ subject: "Math", value: 3, semester: 2 }),
      grade({ subject: "German", value: 4 }),
      grade({ subject: "Math (Written)", value: 4, semester: 7 }),
    ]);
    expect(screen.getByText("Total grades").nextSibling!.textContent).toBe("3");
    expect(screen.getByText("Highest grade").nextSibling!.textContent).toBe("5");
    expect(screen.getByText("Semester Pass / Fail")).toBeTruthy();
    expect(screen.getByText("2 grades")).toBeTruthy();
    await user.click(screen.getAllByRole("button", { name: "BZZ" })[0]);
    expect(screen.getByText(/No BZZ grades yet/)).toBeTruthy();
  });

  it("shows BZZ statistics and the empty KSH state", async () => {
    const user = userEvent.setup();
    await renderStats("school=BZZ", [
      grade({ subject: "431", value: 5, school: "BZZ" }),
      grade({ subject: "187", value: 4, school: "BZZ" }),
      grade({ subject: "IPA", value: 5, school: "BZZ" }),
    ]);
    expect(screen.getByText("Normal Module Grades")).toBeTruthy();
    expect(screen.getByText("Grades per Module")).toBeTruthy();
    expect(screen.getAllByText("IPA", { selector: "p" })[0].nextSibling!.textContent).toBe("5.00");
    await user.click(screen.getAllByRole("button", { name: "KSH" })[0]);
    expect(screen.getByText(/No KSH grades yet/)).toBeTruthy();
  });
});

describe("LoginPage", () => {
  async function submit(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText("Email"), "a@b.c");
    await user.type(screen.getByLabelText("Password"), "pw");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
  }

  it("signs in and goes to the dashboard", async () => {
    const user = userEvent.setup();
    nav.searchParams = new URLSearchParams("verified=1");
    session.signIn.mockResolvedValue({ error: null });
    render(<LoginPage />);
    expect(screen.getByText(/Email verified successfully/)).toBeTruthy();
    await submit(user);
    expect(session.signIn).toHaveBeenCalledWith("credentials", { email: "a@b.c", password: "pw", redirect: false });
    await waitFor(() => expect(nav.router.push).toHaveBeenCalledWith("/dashboard"));
  });

  it("explains failed sign-ins", async () => {
    const user = userEvent.setup();
    nav.searchParams = new URLSearchParams("registered=1");
    render(<LoginPage />);
    expect(screen.getByText(/Account created!/)).toBeTruthy();

    session.signIn.mockResolvedValue({ error: "CredentialsSignin" });
    await submit(user);
    expect(await screen.findByText("Invalid email or password")).toBeTruthy();

    session.signIn.mockResolvedValue({ error: "EMAIL_NOT_VERIFIED" });
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText(/Please verify your email/)).toBeTruthy();

    session.signIn.mockRejectedValue(new Error("network"));
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Something went wrong")).toBeTruthy();
  });
});

describe("RegisterPage", () => {
  it("registers and shows API errors", async () => {
    const user = userEvent.setup();
    let reply = json({ error: "Password must be at least 6 characters" }, 400);
    installFakeApi({}, ({ url }) => (url === "/api/register" ? reply : undefined));
    render(<RegisterPage />);
    await user.type(screen.getByLabelText("Name"), "A");
    await user.type(screen.getByLabelText("Email"), "a@b.c");
    await user.type(screen.getByLabelText("Password"), "secret1");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Password must be at least 6 characters")).toBeTruthy();

    reply = json({}, 500);
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Something went wrong")).toBeTruthy();

    reply = json({ message: "ok" }, 201);
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText(/Please check your email/)).toBeTruthy();
  });
});
