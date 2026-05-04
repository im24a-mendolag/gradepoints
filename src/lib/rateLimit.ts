import { prisma } from "./prisma";

export async function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000
): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const result = await prisma.$queryRaw<{ count: bigint }[]>`
    INSERT INTO "RateLimit" ("userId", "windowStart", "count")
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("userId", "windowStart") DO UPDATE
    SET "count" = "RateLimit"."count" + 1
    RETURNING "count"
  `;

  return Number(result[0].count) <= limit;
}
