// Global test setup: mocks for Next.js / next-auth client APIs and jsdom gaps.
import { afterEach, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { nav, session } from "./mocks";

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => nav.router,
  useSearchParams: () => nav.searchParams,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...rest }, children),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: session.data, update: session.update }),
  signIn: (...args: unknown[]) => session.signIn(...args),
  signOut: (...args: unknown[]) => session.signOut(...args),
}));

if (typeof window !== "undefined") {
  // recharts' ResponsiveContainer and matchMedia-based theme code need these.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(async () => {
  if (typeof window !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
  nav.reset();
  session.reset();
});
