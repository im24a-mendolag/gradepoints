import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock as prisma, resetPrisma } from "../../test/prismaMock";

const authMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { requireUser, badRequest, schoolFilter, round3, validateGradeFields } = await import("./api");
const { checkRateLimit } = await import("./rateLimit");
const { rateLimitByIp } = await import("./rate-limit");

beforeEach(() => {
  resetPrisma();
  authMock.mockReset();
});

describe("requireUser", () => {
  it("rejects signed-out requests with 401", async () => {
    authMock.mockResolvedValue(null);
    const { error } = await requireUser();
    expect(error!.status).toBe(401);
  });

  it("returns the user id, rate limiting only when asked", async () => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    expect(await requireUser()).toEqual({ userId: "u1" });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();

    prisma.$queryRaw.mockResolvedValue([{ count: BigInt(1) }]);
    expect(await requireUser({ rateLimit: true })).toEqual({ userId: "u1" });

    prisma.$queryRaw.mockResolvedValue([{ count: BigInt(61) }]);
    const { error } = await requireUser({ rateLimit: true });
    expect(error!.status).toBe(429);
  });
});

describe("api helpers", () => {
  it("builds 400 responses and the school filter", async () => {
    const res = badRequest("nope");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "nope" });
    expect(schoolFilter(new Request("http://x/api?school=BZZ"))).toEqual({ school: "BZZ" });
    expect(schoolFilter(new Request("http://x/api"))).toEqual({});
  });

  it("rounds to 3 decimals", () => {
    expect(round3("4.12345")).toBe(4.123);
    expect(round3(5)).toBe(5);
  });

  it.each([
    [{}, null],
    [{ value: 4, weight: 1, description: "x", date: "2025-01-01" }, null],
    [{ value: 0.5 }, "Grade must be between 1 and 6"],
    [{ value: "abc" }, "Grade must be between 1 and 6"],
    [{ weight: -1 }, "Weight must be a non-negative number"],
    [{ description: 5 }, "Description must be a string under 500 characters"],
    [{ description: "x".repeat(501) }, "Description must be a string under 500 characters"],
    [{ date: "not a date" }, "Invalid date"],
    [{ date: "1990-01-01" }, "Invalid date"],
  ])("validateGradeFields(%j) → %s", (fields, expected) => {
    expect(validateGradeFields(fields)).toBe(expected);
  });
});

describe("rate limiting", () => {
  it("allows up to the limit within a window", async () => {
    prisma.$queryRaw.mockResolvedValue([{ count: BigInt(5) }]);
    expect(await checkRateLimit("k", 5)).toBe(true);
    prisma.$queryRaw.mockResolvedValue([{ count: BigInt(6) }]);
    expect(await checkRateLimit("k", 5)).toBe(false);
  });

  it("keys IP limits on x-real-ip, then x-forwarded-for, then 'unknown'", async () => {
    prisma.$queryRaw.mockResolvedValue([{ count: BigInt(1) }]);
    const keys = () => prisma.$queryRaw.mock.calls.map((c) => c[1]);

    await rateLimitByIp(new Request("http://x", { headers: { "x-real-ip": "1.1.1.1" } }));
    await rateLimitByIp(new Request("http://x", { headers: { "x-forwarded-for": "2.2.2.2, 3.3.3.3" } }), { maxRequests: 1 });
    expect(await rateLimitByIp(new Request("http://x"), { windowMs: 1000 })).toEqual({ allowed: true });
    expect(keys()).toEqual(["ip:1.1.1.1", "ip:2.2.2.2", "ip:unknown"]);
  });
});
