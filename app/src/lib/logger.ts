type LogLevel = "debug" | "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const MIN_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel | undefined) ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

const SENSITIVE_KEY = /(key|token|secret|password|authorization|apikey)/i;

/**
 * Remove values that must never reach logs, and keep payloads bounded so a
 * single long document does not flood the log stream.
 */
function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    return value.length > 300 ? `${value.slice(0, 300)}…(${value.length} chars)` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (depth >= 3) return "[truncated]";
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redact(item, depth + 1));
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key) ? "[redacted]" : redact(item, depth + 1),
      ])
    );
  }
  return String(value);
}

function write(level: LogLevel, event: string, fields: LogFields = {}): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;

  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...(redact(fields) as LogFields),
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (event: string, fields?: LogFields) => write("debug", event, fields),
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};

/**
 * Normalize an unknown thrown value into log-safe fields. Walks the `cause`
 * chain because fetch/undici surfaces the real reason (socket reset, body
 * timeout) there, while the outer error is only `TypeError: terminated`.
 */
export function errorFields(error: unknown): LogFields {
  if (error instanceof Error) {
    const fields: LogFields = {
      errorName: error.name,
      errorMessage: error.message,
    };

    const causes: string[] = [];
    let cause: unknown = (error as { cause?: unknown }).cause;
    let hops = 0;
    while (cause && hops < 3) {
      causes.push(
        cause instanceof Error
          ? `${cause.name}: ${cause.message}`
          : String(cause)
      );
      cause = (cause as { cause?: unknown }).cause;
      hops += 1;
    }
    if (causes.length > 0) fields.errorCause = causes.join(" <- ");

    return fields;
  }
  return { errorMessage: String(error) };
}
