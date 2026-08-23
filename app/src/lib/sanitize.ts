/**
 * Server-side input sanitization and validation utilities.
 * Provides defense-in-depth against prompt injection and malicious inputs.
 */

import type { MustHavesState } from "@/types/schema";

const INJECTION_PATTERNS: RegExp[] = [
  // English injection patterns
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?(your\s+)?instructions/i,
  /you\s+are\s+now\s+/i,
  /new\s+system\s+prompt/i,
  /override\s+system/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /show\s+(me\s+)?(your\s+)?(system\s+)?prompt/i,
  /what\s+(is|are)\s+(your\s+)?(system\s+)?instructions/i,
  /act\s+as\s+if\s+you\s+have\s+no\s+restrictions/i,
  /pretend\s+(you\s+)?(are|have)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /ignore\s+all\s+safety/i,
  /bypass\s+(your\s+)?filters/i,
  /\[INST\]/i,
  /<<SYS>>/i,

  // Indonesian injection patterns
  /abaikan\s+(semua\s+)?instruksi/i,
  /abaikan\s+(semua\s+)?aturan/i,
  /lupakan\s+(semua\s+)?instruksi/i,
  /lupakan\s+(semua\s+)?aturan/i,
  /tampilkan\s+(semua\s+)?(system\s+)?prompt/i,
  /tunjukkan\s+(system\s+)?prompt/i,
  /bocorkan\s+(system\s+)?prompt/i,
  /kamu\s+sekarang\s+adalah/i,
  /jadilah\s+seperti\s+ai\s+tanpa\s+batasan/i,
  /mode\s+tanpa\s+batas/i,
  /lewati\s+(filter|keamanan|aturan)/i,
];

/**
 * Check if text contains prompt injection patterns.
 */
export function containsPromptInjection(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const normalized = text
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
    .replace(/\s+/g, " ");
  return INJECTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Sanitize a single text input.
 * Trims, limits length, and removes control characters & zero-width artifacts.
 */
export function sanitizeText(input: string, maxLength: number = 10000): string {
  if (!input || typeof input !== "string") return "";
  const trimmed = input.trim();
  const limited = trimmed.slice(0, maxLength);
  return limited
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

/**
 * Validate chat messages payload.
 * Returns sanitized messages or throws if invalid.
 */
export function validateChatMessages(
  messages: unknown
): Array<{ role: string; content: string }> {
  if (!Array.isArray(messages)) {
    throw new Error("Messages must be an array");
  }

  if (messages.length > 100) {
    throw new Error("Too many messages");
  }

  return messages.map((msg, index) => {
    if (!msg || typeof msg !== "object") {
      throw new Error(`Invalid message at index ${index}`);
    }

    const { role, content } = msg as Record<string, unknown>;

    if (typeof role !== "string" || !["user", "assistant", "system"].includes(role)) {
      throw new Error(`Invalid role at index ${index}`);
    }

    if (typeof content !== "string") {
      throw new Error(`Invalid content at index ${index}`);
    }

    return {
      role: role as string,
      content: sanitizeText(content),
    };
  });
}

/**
 * Extract and sanitize a single string | null field from raw input.
 */
function extractField(raw: Record<string, unknown>, key: string): string | null {
  const value = raw[key];
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return sanitizeText(value);
  return null;
}

/**
 * Validate Must-Haves state payload.
 * Returns a fully-typed MustHavesState with all 8 keys guaranteed.
 */
export function validateMustHaves(mustHaves: unknown): MustHavesState {
  if (!mustHaves || typeof mustHaves !== "object") {
    throw new Error("Invalid mustHaves payload");
  }

  const raw = mustHaves as Record<string, unknown>;

  return {
    projectVision: extractField(raw, "projectVision"),
    userRolesPermissions: extractField(raw, "userRolesPermissions"),
    keyFeatures: extractField(raw, "keyFeatures"),
    techStackCore: extractField(raw, "techStackCore"),
    dataFlowIntegration: extractField(raw, "dataFlowIntegration"),
    qaAndTesting: extractField(raw, "qaAndTesting"),
    securityCompliance: extractField(raw, "securityCompliance"),
    teamPersonas: extractField(raw, "teamPersonas"),
  };
}
