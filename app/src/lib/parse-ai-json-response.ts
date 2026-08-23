import { type MustHaveKey, normalizeMustHaveKey } from "@/types/schema";

export interface ParsedAIResponse {
  reply: string;
  extractedVariables: Partial<Record<MustHaveKey, string | null>>;
}

function cleanExtractedVariables(
  rawVars: unknown
): Partial<Record<MustHaveKey, string | null>> {
  if (!rawVars || typeof rawVars !== "object") return {};
  const cleaned: Partial<Record<MustHaveKey, string | null>> = {};

  for (const [key, value] of Object.entries(rawVars as Record<string, unknown>)) {
    const normalizedKey = normalizeMustHaveKey(key);
    if (!normalizedKey) continue;

    if (value === null || value === undefined) {
      cleaned[normalizedKey] = null;
    } else if (typeof value === "string") {
      const trimmed = value.trim();
      cleaned[normalizedKey] = trimmed.length > 0 ? trimmed : null;
    } else if (typeof value === "object") {
      try {
        cleaned[normalizedKey] = JSON.stringify(value);
      } catch {
        cleaned[normalizedKey] = null;
      }
    }
  }

  return cleaned;
}

export function parseAIJsonResponse(text: string): ParsedAIResponse {
  let cleaned = text.trim();

  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  const codeBlockMatches = Array.from(
    cleaned.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi)
  );

  for (let index = codeBlockMatches.length - 1; index >= 0; index -= 1) {
    const blockContent = codeBlockMatches[index][1].trim();

    try {
      const parsed = JSON.parse(blockContent);
      if (parsed && typeof parsed === "object" && "reply" in parsed) {
        return {
          reply: String(parsed.reply || ""),
          extractedVariables: cleanExtractedVariables(parsed.extractedVariables),
        };
      }
    } catch {}
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object" && "reply" in parsed) {
      return {
        reply: String(parsed.reply || ""),
        extractedVariables: cleanExtractedVariables(parsed.extractedVariables),
      };
    }
  } catch {}

  const matches = Array.from(cleaned.matchAll(/\{[\s\S]*?\}/g));

  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const startIndex = matches[index].index!;
    let braceCount = 0;
    let endIndex = -1;
    let inString = false;
    let escaped = false;

    for (let cursor = startIndex; cursor < cleaned.length; cursor += 1) {
      const character = cleaned[cursor];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === "\\") {
        escaped = true;
        continue;
      }

      if (character === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (character === "{") braceCount += 1;
        if (character === "}") {
          braceCount -= 1;
          if (braceCount === 0) {
            endIndex = cursor + 1;
            break;
          }
        }
      }
    }

    if (endIndex === -1) continue;

    try {
      const parsed = JSON.parse(cleaned.substring(startIndex, endIndex));
      if (parsed && typeof parsed === "object" && "reply" in parsed) {
        return {
          reply: String(parsed.reply || ""),
          extractedVariables: cleanExtractedVariables(parsed.extractedVariables),
        };
      }
    } catch {}
  }

  let fallbackReply = cleaned
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
  const replyMatch = cleaned.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);

  if (replyMatch) {
    try {
      fallbackReply = JSON.parse(`"${replyMatch[1]}"`);
    } catch {
      fallbackReply = replyMatch[1];
    }
  }

  return { reply: fallbackReply, extractedVariables: {} };
}
