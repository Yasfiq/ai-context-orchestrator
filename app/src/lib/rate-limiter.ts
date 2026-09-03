/**
 * Simple in-memory rate limiter.
 * Stores request counts per IP with TTL (per-minute granularity).
 * For production, consider using Redis + @upstash/ratelimit.
 */

import type { NextRequest } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 menit
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 permintaan per menit per IP

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const requestCounts = new Map<string, RateLimitEntry>();

// Cleanup expired entries periodically (avoid unbounded growth)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of requestCounts.entries()) {
    if (now > entry.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

function getClientIP(req: NextRequest): string {
  // Coba dari headers umum (Cloudflare, Vercel, dll)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[0] || "unknown";
  }

  const trueClientIP = req.headers.get("true-client-ip");
  if (trueClientIP) return trueClientIP;

  // Fallback: dari socket/ip (server-side) atau remoteAddress
  return req.ip || "unknown";
}

function isRateLimited(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetTime) {
    // Window baru
    requestCounts.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count };
}

export function checkRateLimit(req: NextRequest): { allowed: boolean; retryAfter: number } {
  const ip = getClientIP(req);
  const { allowed } = isRateLimited(ip);

  if (allowed) {
    return { allowed: true, retryAfter: 0 };
  }

  // Hitung retry-after berdasarkan sisa waktu window
  const entry = requestCounts.get(ip);
  const retryAfter = entry ? Math.ceil((entry.resetTime - Date.now()) / 1000) : 60;
  return { allowed: false, retryAfter: Math.max(1, retryAfter) };
}
