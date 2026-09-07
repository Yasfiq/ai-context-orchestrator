import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limiter";

// Apply rate limit & internal service headers to API routes
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    const { allowed, retryAfter } = checkRateLimit(request);

    if (!allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    // Forward internal service secret to Worker edge securely
    const workerSecret = process.env.WORKER_SECRET;
    if (workerSecret) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-worker-secret", workerSecret);
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
