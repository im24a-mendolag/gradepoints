import { beforeEach, describe, expect, it, vi } from "vitest";
import bcryptjs from "bcryptjs";
import { prismaMock as prisma, resetPrisma } from "../../../test/prismaMock";

const authMock = vi.hoisted(() => vi.fn());
const email = vi.hoisted(() => ({ sendVerificationEmail: vi.fn(), verifyToken: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/email", () => email);

const grades = await import("./grades/route");
const gradeById = await import("./grades/[id]/route");
const adjustments = await import("./adjustments/route");
const account = await import("./account/route");
const register = await import("./register/route");
const verify = await import("./verify/route");

const req = (body?: unknown, url = "http://x/api") =>
  new Request(url, body === undefined ? undefined : { method: "POST", body: JSON.stringify(body) });
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const errorOf = async (res: Response) => (await res.json()).error;

beforeEach(() => {
  resetPrisma();
  authMock.mockReset().mockResolvedValue({ user: { id: "u1" } });
  prisma.$queryRaw.mockResolvedValue([{ count: BigInt(1) }]);
  email.sendVerificationEmail.mockReset();
  email.verifyToken.mockReset();
});

describe("/api/grades", () => {
  it("requires a session", async () => {
    authMock.mockResolvedValue(null);
    expect((await grades.GET(req())).status).toBe(401);
    expect((await grades.POST(req({}))).status).toBe(401);
  });

  it("lists grades filtered by semester and school", async () => {
    prisma.grade.findMany.mockResolvedValue([{ id: "g1" }]);
    const res = await grades.GET(req(undefined, "http://x/api/grades?semester=2&school=KSH"));
    expect(await res.json()).toEqual([{ id: "g1" }]);
    expect(prisma.grade.findMany).toHaveBeenCalledWith({
      where: { userId: "u1", semester: 2, school: "KSH" },
      orderBy: { date: "desc" },
    });
    await grades.GET(req());
    expect(prisma.grade.findMany).toHaveBeenLastCalledWith({ where: { userId: "u1" }, orderBy: { date: "desc" } });
  });

  it.each([
    [{ value: 4, semester: 1 }, "Grade value, semester, and subject are required"],
    [{ value: 7, semester: 1, subject: "Math" }, "Grade must be between 1 and 6"],
    [{ value: 4, semester: 9, subject: "Math" }, "Invalid semester"],
    [{ value: 4, semester: 1, subject: "IDPA" }, "This subject is not available in this semester"],
    [{ value: 4, semester: 1, subject: "Math", school: "BZZ" }, "This module is not valid for BZZ"],
  ])("rejects invalid POST %j", async (body, message) => {
    const res = await grades.POST(req(body));
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe(message);
  });

  it("creates KSH and BZZ grades with defaults and rounding", async () => {
    prisma.grade.create.mockImplementation(async ({ data }) => ({ id: "new", ...data }));
    const res = await grades.POST(req({ value: "4.12345", semester: 1, subject: "Math" }));
    expect(res.status).toBe(201);
    expect(prisma.grade.create.mock.calls[0][0].data).toMatchObject({
      value: 4.123, weight: 1, description: "", school: "KSH", userId: "u1",
    });

    await grades.POST(req({ value: 5, weight: "0.5", description: "LB1", date: "2025-02-01", semester: 1, subject: "431", school: "BZZ" }));
    expect(prisma.grade.create.mock.calls[1][0].data).toMatchObject({ weight: 0.5, school: "BZZ", description: "LB1" });
  });

  it("rate limits writes", async () => {
    prisma.$queryRaw.mockResolvedValue([{ count: BigInt(100) }]);
    expect((await grades.POST(req({}))).status).toBe(429);
  });
});

describe("/api/grades/[id]", () => {
  it("updates only provided fields of an owned grade", async () => {
    prisma.grade.findFirst.mockResolvedValue({ id: "g1" });
    prisma.grade.update.mockResolvedValue({ id: "g1", value: 5 });
    const res = await gradeById.PUT(req({ value: "5", description: "x" }), params("g1"));
    expect(await res.json()).toEqual({ id: "g1", value: 5 });
    expect(prisma.grade.update).toHaveBeenCalledWith({ where: { id: "g1" }, data: { value: 5, description: "x" } });

    await gradeById.PUT(req({ weight: 2, date: "2025-03-01" }), params("g1"));
    expect(prisma.grade.update.mock.calls[1][0].data).toEqual({ weight: 2, date: new Date("2025-03-01") });
  });

  it("validates input, ownership and auth", async () => {
    expect(await errorOf(await gradeById.PUT(req({ weight: -2 }), params("g1")))).toBe("Weight must be a non-negative number");
    prisma.grade.findFirst.mockResolvedValue(null);
    expect((await gradeById.PUT(req({}), params("g1"))).status).toBe(404);
    expect((await gradeById.DELETE(req(), params("g1"))).status).toBe(404);
    authMock.mockResolvedValue(null);
    expect((await gradeById.PUT(req({}), params("g1"))).status).toBe(401);
    expect((await gradeById.DELETE(req(), params("g1"))).status).toBe(401);
  });

  it("deletes an owned grade", async () => {
    prisma.grade.findFirst.mockResolvedValue({ id: "g1" });
    const res = await gradeById.DELETE(req(), params("g1"));
    expect(await res.json()).toEqual({ message: "Grade deleted" });
    expect(prisma.grade.delete).toHaveBeenCalledWith({ where: { id: "g1" } });
  });
});

describe("/api/adjustments", () => {
  const key = (school: string) => ({ userId_semester_subject_school: { userId: "u1", semester: 1, subject: "Math", school } });

  it("lists, upserts and deletes adjustments", async () => {
    prisma.adjustment.findMany.mockResolvedValue([]);
    await adjustments.GET(req(undefined, "http://x/api/adjustments?school=BZZ"));
    expect(prisma.adjustment.findMany).toHaveBeenCalledWith({ where: { userId: "u1", school: "BZZ" } });

    prisma.adjustment.upsert.mockResolvedValue({ id: "a1" });
    expect((await adjustments.POST(req({ value: "0.5", semester: 1, subject: "Math" }))).status).toBe(200);
    expect(prisma.adjustment.upsert.mock.calls[0][0]).toMatchObject({ where: key("KSH"), update: { value: 0.5 } });

    expect(await (await adjustments.DELETE(req({ semester: 1, subject: "Math", school: "BZZ" }))).json()).toEqual({ success: true });
    expect(prisma.adjustment.delete).toHaveBeenCalledWith({ where: key("BZZ") });
  });

  it("validates input, reports missing rows and requires auth", async () => {
    expect((await adjustments.POST(req({ semester: 1, subject: "Math" }))).status).toBe(400);
    expect((await adjustments.DELETE(req({ subject: "Math" }))).status).toBe(400);
    prisma.adjustment.delete.mockRejectedValue(new Error("missing"));
    expect((await adjustments.DELETE(req({ semester: 1, subject: "Math" }))).status).toBe(404);
    authMock.mockResolvedValue(null);
    expect((await adjustments.GET(req())).status).toBe(401);
    expect((await adjustments.POST(req({}))).status).toBe(401);
    expect((await adjustments.DELETE(req({}))).status).toBe(401);
  });
});

describe("/api/account", () => {
  const password = bcryptjs.hashSync("oldpass", 4);
  const user = { id: "u1", email: "a@b.c", password };

  beforeEach(() => prisma.user.findUnique.mockResolvedValue(user));

  it("renames the user", async () => {
    const res = await account.PUT(req({ name: "  New  " }));
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { name: "New" } });
  });

  it("changes the password after checking the current one", async () => {
    expect((await account.PUT(req({ currentPassword: "wrong", newPassword: "newpass1" }))).status).toBe(403);
    expect((await account.PUT(req({ currentPassword: "oldpass", newPassword: "newpass1" }))).status).toBe(200);
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(bcryptjs.compareSync("newpass1", data.password)).toBe(true);
  });

  it.each([
    [{ name: "   " }, "Name cannot be empty"],
    [{ newPassword: "abcdef" }, "Both current password and new password are required"],
    [{ currentPassword: "oldpass", newPassword: "abc" }, "New password must be at least 6 characters"],
    [{}, "Nothing to update"],
  ])("rejects PUT %j", async (body, message) => {
    const res = await account.PUT(req(body));
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe(message);
  });

  it("deletes the account with the right password", async () => {
    expect((await account.DELETE(req({}))).status).toBe(400);
    expect((await account.DELETE(req({ password: "wrong" }))).status).toBe(403);
    expect((await account.DELETE(req({ password: "oldpass" }))).status).toBe(200);
    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({ where: { email: "a@b.c" } });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("handles missing users and sessions", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    expect((await account.PUT(req({ name: "x" }))).status).toBe(404);
    expect((await account.DELETE(req({ password: "x" }))).status).toBe(404);
    authMock.mockResolvedValue(null);
    expect((await account.PUT(req({}))).status).toBe(401);
    expect((await account.DELETE(req({}))).status).toBe(401);
  });
});

describe("/api/register", () => {
  it("validates input", async () => {
    expect((await register.POST(req({ email: "a@b.c" }))).status).toBe(400);
    expect((await register.POST(req({ name: "A", email: "a@b.c", password: "abc" }))).status).toBe(400);
  });

  it("creates new users and re-sends verification for unverified ones", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    expect((await register.POST(req({ name: "A", email: "a@b.c", password: "secret1" }))).status).toBe(201);
    expect(prisma.user.create.mock.calls[0][0].data).toMatchObject({ name: "A", email: "a@b.c", emailVerified: false });
    expect(email.sendVerificationEmail).toHaveBeenCalledWith("a@b.c");

    prisma.user.findUnique.mockResolvedValue({ emailVerified: false });
    expect((await register.POST(req({ name: "A", email: "a@b.c", password: "secret1" }))).status).toBe(200);
    expect(email.sendVerificationEmail).toHaveBeenCalledTimes(2);

    prisma.user.findUnique.mockResolvedValue({ emailVerified: true });
    expect((await register.POST(req({ name: "A", email: "a@b.c", password: "secret1" }))).status).toBe(200);
    expect(email.sendVerificationEmail).toHaveBeenCalledTimes(2);
  });

  it("rate limits and reports unexpected errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    prisma.user.findUnique.mockRejectedValue(new Error("db down"));
    expect((await register.POST(req({ name: "A", email: "a@b.c", password: "secret1" }))).status).toBe(500);
    prisma.$queryRaw.mockResolvedValue([{ count: BigInt(100) }]);
    expect((await register.POST(req({}))).status).toBe(429);
  });
});

describe("/api/verify", () => {
  const location = (res: Response) => res.headers.get("location");

  it("redirects with the verification result", async () => {
    expect(location(await verify.GET(req(undefined, "http://x/api/verify")))).toContain("Missing+token");

    email.verifyToken.mockResolvedValue({ success: true });
    expect(location(await verify.GET(req(undefined, "http://x/api/verify?token=t")))).toBe("http://x/verify?status=success");

    email.verifyToken.mockResolvedValue({ success: false, error: "Expired link" });
    expect(location(await verify.GET(req(undefined, "http://x/api/verify?token=t")))).toContain("Expired%20link");

    email.verifyToken.mockResolvedValue({ success: false });
    expect(location(await verify.GET(req(undefined, "http://x/api/verify?token=t")))).toContain("Verification%20failed");

    prisma.$queryRaw.mockResolvedValue([{ count: BigInt(100) }]);
    expect(location(await verify.GET(req(undefined, "http://x/api/verify?token=t")))).toContain("Too+many+requests");
  });
});
