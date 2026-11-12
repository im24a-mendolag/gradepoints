// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeToggle from "./ThemeToggle";

const active = () => screen.getAllByRole("button").find((b) => b.className.includes("bg-surface"))?.textContent;
const theme = () => document.documentElement.getAttribute("data-theme");

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("ThemeToggle", () => {
  it("shows the stored preference and defaults to dark", () => {
    const { unmount } = render(<ThemeToggle />);
    expect(active()).toBe("Dark");
    unmount();
    localStorage.setItem("gp-theme", "light");
    render(<ThemeToggle />);
    expect(active()).toBe("Light");
  });

  it("persists and applies a new preference, resolving 'system' via media query", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole("button", { name: "Light" }));
    expect(localStorage.getItem("gp-theme")).toBe("light");
    expect(theme()).toBe("light");
    expect(active()).toBe("Light");

    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    await user.click(screen.getByRole("button", { name: "System" }));
    expect(theme()).toBe("light");
    expect(active()).toBe("System");
  });

  it("follows changes made in another tab", () => {
    render(<ThemeToggle />);
    localStorage.setItem("gp-theme", "system");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "gp-theme" }));
    });
    expect(active()).toBe("System");
  });
});
