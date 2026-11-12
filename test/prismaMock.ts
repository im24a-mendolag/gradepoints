// A vi.fn()-based Prisma stand-in. Use with: vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
import { vi } from "vitest";

const model = () => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
});

export const prismaMock = {
  grade: model(),
  adjustment: model(),
  user: model(),
  verificationToken: model(),
  $queryRaw: vi.fn(),
};

export function resetPrisma() {
  for (const m of Object.values(prismaMock)) {
    if (typeof m === "function") m.mockReset();
    else for (const fn of Object.values(m)) fn.mockReset();
  }
}
