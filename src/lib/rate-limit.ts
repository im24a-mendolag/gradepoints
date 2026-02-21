const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory sliding-window rate limiter.
 * Not shared across serverless instances — provides basic protection,
 * not a substitute for infrastructure-level rate limiting.
 */
export function rateLimit(
  key: string,
  { maxRequests = 5, windowMs = 60_000 } = {}
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  return { allowed: entry.count <= maxRequests, remaining };
}

export function rateLimitByIp(
  request: Request,
  opts?: { maxRequests?: number; windowMs?: number }
) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return rateLimit(ip, opts);
}
