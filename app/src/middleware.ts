import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limiter";

// Apply rate limit to API routes only
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only apply to API routes
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
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
