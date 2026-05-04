import { prisma } from "./prisma";

const LIMIT = 20;
const WINDOW_MS = 60_000;

export async function checkRateLimit(userId: string): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);

  const result = await prisma.$queryRaw<{ count: bigint }[]>`
    INSERT INTO "RateLimit" ("userId", "windowStart", "count")
    VALUES (${userId}, ${windowStart}, 1)
    ON CONFLICT ("userId", "windowStart") DO UPDATE
    SET "count" = "RateLimit"."count" + 1
    RETURNING "count"
  `;

  return Number(result[0].count) <= LIMIT;
}
