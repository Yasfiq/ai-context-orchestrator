import { cleanAntiSlop } from "@/lib/anti-slop";
import { normalizeMermaidMarkdown } from "@/lib/mermaid-markdown";

const REASONING_PREFIXES = [
  /^here(?:'s| is) (?:a |the )?(?:thinking|reasoning|analysis) process/i,
  /^thinking process:/i,
  /^analysis:/i,
];

export interface ValidatedModelOutput {
  content: string;
}

export function cleanModelOutput(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/<analysis>[\s\S]*?<\/analysis>/gi, "").trim();

  const outerFence = cleaned.match(
    /^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i
  );
  if (outerFence?.[1]) {
    cleaned = outerFence[1].trim();
  }

  cleaned = cleaned
    .replace(
      /^(?:here(?:'s|\s+is)\s+(?:the\s+)?(?:updated|revised|complete)\s+document:?|(?:sure|certainly)[^\n]*:?)\s*\n+/i,
      ""
    )
    .trim();

  cleaned = cleaned.replace(/(`{3,})(#{1,6}\s+)/g, "$1\n\n$2");
  cleaned = cleaned.replace(/(`{3,})(---+)\s*$/gm, "$1\n\n$2");

  const isReasoning = REASONING_PREFIXES.some((pattern) => pattern.test(cleaned));
  if (!isReasoning) {
    const headingMatch = cleaned.search(/^#{1,6}\s+\S/m);
    if (headingMatch > 0) {
      cleaned = cleaned.slice(headingMatch).trim();
    }
  }

  cleaned = cleanAntiSlop(cleaned);

  return cleaned;
}

export function validateModelDocument(
  text: string,
  finishReason: string,
  options: { minimumLength?: number; previousLength?: number } = {}
): ValidatedModelOutput {
  const content = normalizeMermaidMarkdown(cleanModelOutput(text));
  const minimumLength = options.minimumLength ?? 200;

  if (!content || content.length < minimumLength) {
    throw new Error("Model returned an empty or incomplete document.");
  }

  if (finishReason === "length") {
    throw new Error("Model output reached the token limit before completion.");
  }

  if (REASONING_PREFIXES.some((pattern) => pattern.test(content))) {
    throw new Error("Model returned internal reasoning instead of a document.");
  }

  if (!/^#{1,6}\s+\S/m.test(content)) {
    throw new Error("Model response does not contain a valid Markdown document.");
  }

  const codeFenceCount = content.match(/```/g)?.length ?? 0;
  if (codeFenceCount % 2 !== 0) {
    throw new Error("Model returned a truncated Markdown code block.");
  }

  if (
    options.previousLength &&
    options.previousLength >= 2000 &&
    content.length < options.previousLength * 0.35
  ) {
    throw new Error("Updated document is unexpectedly shorter than the original.");
  }

  return { content };
}
