import type { Context, MiddlewareHandler } from "hono";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

function getClientIP(c: Context): string {
  return (
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-real-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}

function cleanupStore(now: number) {
  if (store.size > 500) {
    for (const [ip, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(ip);
      }
    }
  }
}

export function edgeRateLimiter(config: RateLimitConfig): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now();
    cleanupStore(now);

    const ip = getClientIP(c);
    const entry = store.get(ip);

    if (!entry || now > entry.resetTime) {
      store.set(ip, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      c.header("X-RateLimit-Limit", String(config.maxRequests));
      c.header("X-RateLimit-Remaining", String(config.maxRequests - 1));
      c.header("X-RateLimit-Reset", String(Math.ceil((now + config.windowMs) / 1000)));
      return next();
    }

    entry.count += 1;
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetSec = Math.ceil((entry.resetTime - now) / 1000);

    c.header("X-RateLimit-Limit", String(config.maxRequests));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetTime / 1000)));

    if (entry.count > config.maxRequests) {
      c.header("Retry-After", String(resetSec));
      return c.json(
        {
          error: "Terlalu banyak permintaan. Silakan tunggu beberapa saat lagi.",
        },
        429
      );
    }

    return next();
  };
}
