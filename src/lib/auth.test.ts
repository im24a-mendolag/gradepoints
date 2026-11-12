import { beforeEach, describe, expect, it, vi } from "vitest";
import bcryptjs from "bcryptjs";
import { prismaMock as prisma, resetPrisma } from "../../test/prismaMock";
import { authConfig } from "./auth.config";

vi.mock("@/lib/prisma", () => ({ prisma }));

// Capture the config auth.ts hands to NextAuth so the credentials callback can be called directly.
const captured = vi.hoisted(() => ({ config: null as null | { providers: { authorize: (c: unknown) => unknown }[] } }));
vi.mock("next-auth", () => ({
  default: (config: typeof captured.config) => {
    captured.config = config;
    return { handlers: {}, auth: vi.fn() };
  },
}));
vi.mock("next-auth/providers/credentials", () => ({ default: (opts: unknown) => opts }));

await import("./auth");
const authorize = (creds: unknown) => captured.config!.providers[0].authorize(creds);

beforeEach(resetPrisma);

describe("credentials authorize", () => {
  const password = bcryptjs.hashSync("secret1", 4);

  it("rejects missing credentials and unknown users", async () => {
    expect(await authorize({ email: "a@b.c" })).toBeNull();
    expect(await authorize(undefined)).toBeNull();
    prisma.user.findUnique.mockResolvedValue(null);
    expect(await authorize({ email: "a@b.c", password: "x" })).toBeNull();
  });

  it("rejects unverified users and wrong passwords", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.c", name: "A", password, emailVerified: false });
    await expect(authorize({ email: "a@b.c", password: "secret1" })).rejects.toThrow("EMAIL_NOT_VERIFIED");

    prisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.c", name: "A", password, emailVerified: true });
    expect(await authorize({ email: "a@b.c", password: "wrong" })).toBeNull();
  });

  it("returns the user on a correct password", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1", email: "a@b.c", name: "A", password, emailVerified: true });
    expect(await authorize({ email: "a@b.c", password: "secret1" })).toEqual({ id: "u1", name: "A", email: "a@b.c" });
  });
});

describe("authConfig callbacks", () => {
  const cb = authConfig.callbacks!;

  it("stores the user id and renamed user on the token", async () => {
    const jwt = cb.jwt as unknown as (p: Record<string, unknown>) => Promise<Record<string, unknown>>;
    expect(await jwt({ token: {}, user: { id: "u1" } })).toEqual({ id: "u1" });
    expect(await jwt({ token: { id: "u1" }, trigger: "update", session: { name: "New" } })).toEqual({ id: "u1", name: "New" });
    expect(await jwt({ token: { id: "u1" }, trigger: "update", session: {} })).toEqual({ id: "u1" });
  });

  it("copies the token id onto the session user", async () => {
    const session = cb.session as unknown as (p: Record<string, unknown>) => Promise<{ user?: { id?: string } }>;
    expect((await session({ session: { user: {} }, token: { id: "u1" } })).user!.id).toBe("u1");
    expect(await session({ session: {}, token: { id: "u1" } })).toEqual({});
  });

  it("guards the dashboard and bounces signed-in users off auth pages", () => {
    const authorized = cb.authorized as unknown as (p: { auth: unknown; request: { nextUrl: URL } }) => unknown;
    const at = (path: string, auth: unknown) => authorized({ auth, request: { nextUrl: new URL(`http://x${path}`) } });
    const user = { user: { id: "u1" } };

    expect(at("/dashboard", null)).toBe(false);
    expect(at("/dashboard", user)).toBe(true);
    expect((at("/login", user) as Response).headers.get("location")).toBe("http://x/dashboard");
    expect((at("/register", user) as Response).status).toBe(302);
    expect(at("/login", null)).toBe(true);
    expect(at("/", null)).toBe(true);
  });
});
