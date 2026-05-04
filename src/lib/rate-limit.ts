import { checkRateLimit } from "./rateLimit";

export async function rateLimitByIp(
  request: Request,
  opts: { maxRequests?: number; windowMs?: number } = {}
): Promise<{ allowed: boolean }> {
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const allowed = await checkRateLimit(`ip:${ip}`, opts.maxRequests ?? 5, opts.windowMs ?? 60_000);
  return { allowed };
}
