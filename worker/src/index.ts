import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import { logger as honoLogger } from "hono/logger";
import type { Env } from "./types/env";
import { chatRoute } from "./routes/chat";
import { generateRoute } from "./routes/generate";
import { tweakRoute } from "./routes/tweak";
import { edgeRateLimiter } from "./lib/rate-limiter";

const app = new Hono<{ Bindings: Env }>();

// 1. Logger
app.use("*", honoLogger());

// 2. HTTP Security Headers (OWASP recommendations)
app.use(
  "*",
  secureHeaders({
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    strictTransportSecurity: "max-age=31536000; includeSubDomains",
    xXssProtection: "0",
  })
);

// 3. Payload Size Guard (Maximum 256KB per request body)
app.use(
  "*",
  bodyLimit({
    maxSize: 256 * 1024,
    onError: (c) => {
      return c.json(
        { error: "Ukuran request melebihi batas maksimal yang diizinkan (256KB)." },
        413
      );
    },
  })
);

// 4. Dynamic CORS configuration
app.use("*", async (c, next) => {
  const allowed = (c.env.ALLOWED_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim());

  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin) return allowed[0] || "*";
      if (allowed.includes("*") || allowed.includes(origin)) {
        return origin;
      }
      return null;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Worker-Secret"],
    maxAge: 86400,
  });

  return corsMiddleware(c, next);
});

// 5. Service-to-Service Secret Authentication (Optional/Enforced if WORKER_SECRET is defined)
app.use("/api/*", async (c, next) => {
  if (c.req.method === "OPTIONS") return next();

  const expectedSecret = c.env.WORKER_SECRET;
  if (expectedSecret && expectedSecret.trim().length > 0) {
    const clientSecret =
      c.req.header("x-worker-secret") ||
      c.req.header("authorization")?.replace(/^Bearer\s+/i, "");

    if (!clientSecret || clientSecret !== expectedSecret) {
      return c.json(
        { error: "Akses ditolak. Kredensial otentikasi worker tidak valid." },
        401
      );
    }
  }
  return next();
});

// 6. Edge Rate Limiting (IP-Based)
app.use("/api/chat", edgeRateLimiter({ maxRequests: 30, windowMs: 60_000 }));
app.use("/api/generate/*", edgeRateLimiter({ maxRequests: 10, windowMs: 60_000 }));
app.use("/api/tweak", edgeRateLimiter({ maxRequests: 20, windowMs: 60_000 }));

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "ai-context-orchestrator-worker",
    timestamp: Date.now(),
  });
});

// Route registration
app.route("/api/chat", chatRoute);
app.route("/api/generate", generateRoute);
app.route("/api/tweak", tweakRoute);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Endpoint not found" }, 404);
});

// Global error handler - Sanitize errors to avoid leaking internal stack traces or keys
app.onError((err, c) => {
  console.error("Unhandled Worker Error:", err);
  return c.json(
    { error: "Internal server error. Silakan coba beberapa saat lagi." },
    500
  );
});

export default app;
