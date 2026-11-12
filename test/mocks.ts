// Mutable state behind the global Next.js / next-auth mocks (see setup.ts).
import { vi } from "vitest";

export const nav = {
  pathname: "/dashboard",
  router: { push: vi.fn(), refresh: vi.fn() },
  searchParams: new URLSearchParams(),
  reset() {
    this.pathname = "/dashboard";
    this.router = { push: vi.fn(), refresh: vi.fn() };
    this.searchParams = new URLSearchParams();
  },
};

export const session = {
  data: { user: { id: "u1", name: "Test User", email: "t@example.com" } } as
    | { user: { id: string; name: string; email: string } }
    | null,
  update: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  reset() {
    this.data = { user: { id: "u1", name: "Test User", email: "t@example.com" } };
    this.update = vi.fn();
    this.signIn = vi.fn();
    this.signOut = vi.fn();
  },
};
