import { Hono } from "hono";
import { streamText } from "ai";
import {
  containsPromptInjection,
  sanitizeText,
  validateMustHaves,
} from "@/lib/sanitize";
import type { DocumentName } from "@/types/schema";
import {
  DOCUMENT_LABELS,
  COP_GENERATION_ORDER,
  MUST_HAVE_KEYS,
  MUST_HAVE_LABELS,
} from "@/types/schema";
import { getUniversalLLM, getModelNames } from "@/lib/llm-provider";
import { validateModelDocument } from "@/lib/llm-output";
import { logger, errorFields } from "@/lib/logger";
import type { Env } from "@/types/env";

export const tweakRoute = new Hono<{ Bindings: Env }>();

/**
 * POST /api/tweak
 * Conversational revision of a single document
 */
tweakRoute.post("/", async (c) => {
  const startedAt = Date.now();
  const { tweakModelName } = getModelNames(c.env);
  const universalLLM = getUniversalLLM(c.env);

  try {
    const body = await c.req.json();

    const documentName = body.documentName as DocumentName;
    const currentContent = sanitizeText(body.currentContent || "", 50000);
    const userInstruction = sanitizeText(body.userInstruction || "", 5000);
    const mustHaves = validateMustHaves(body.mustHaves);

    if (!COP_GENERATION_ORDER.includes(documentName)) {
      return c.json({ error: "Invalid document name." }, 400);
    }

    if (!userInstruction.trim()) {
      return c.json({ error: "Instruction cannot be empty." }, 400);
    }

    if (containsPromptInjection(userInstruction)) {
      return c.json(
        { error: "Maaf, permintaan ini melanggar kebijakan keamanan kami." },
        400
      );
    }

    const mustHavesSummary = MUST_HAVE_KEYS.map(
      (key) =>
        `- ${MUST_HAVE_LABELS[key]}: ${mustHaves[key] || "Not specified"}`
    ).join("\n");

    const prompt = `You are a technical document editor. Your task is to modify a ${DOCUMENT_LABELS[documentName]} document based on a user's specific instruction.

## RULES
- Apply ONLY the requested change. Do not rewrite unrelated sections.
- Maintain the existing document structure, formatting, and style.
- Output the COMPLETE updated document (not just the changed section).
- Use clean, professional Markdown.
- Do NOT add commentary or explanations about what you changed — just output the updated document.
- Bilingual: Match the language style of the existing document.

## PROJECT CONTEXT
${mustHavesSummary}

## CURRENT DOCUMENT (${DOCUMENT_LABELS[documentName]})
${currentContent}

## USER'S CHANGE REQUEST
${userInstruction}

## OUTPUT
Provide the complete updated document with the requested changes applied:`;

    const result = streamText({
      model: universalLLM(tweakModelName),
      prompt,
      maxTokens: 8000,
      temperature: 0.4,
    });

    let updatedContent = "";
    for await (const textPart of result.textStream) {
      updatedContent += textPart;
    }

    const finishReason = await result.finishReason;
    const validated = validateModelDocument(updatedContent, finishReason, {
      previousLength: currentContent.length,
    });

    logger.info("[/api/tweak] completed", {
      model: tweakModelName,
      documentName,
      finishReason,
      durationMs: Date.now() - startedAt,
      inputChars: currentContent.length,
      outputChars: validated.content.length,
    });

    return c.json({
      updatedContent: validated.content,
    });
  } catch (error) {
    logger.error("[/api/tweak] failed", {
      model: tweakModelName,
      durationMs: Date.now() - startedAt,
      ...errorFields(error),
    });
    return c.json(
      { error: "Perubahan belum dapat diterapkan. Silakan coba kembali." },
      500
    );
  }
});
