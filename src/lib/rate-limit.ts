import { checkRateLimit } from "./rateLimit";

export async function rateLimitByIp(
  request: Request,
  opts: { maxRequests?: number; windowMs?: number } = {}
): Promise<{ allowed: boolean }> {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const allowed = await checkRateLimit(`ip:${ip}`, opts.maxRequests ?? 5, opts.windowMs ?? 60_000);
  return { allowed };
}
