import { NextRequest, NextResponse } from "next/server";
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
import { tweakModelName, universalLLM } from "@/lib/llm-provider";
import { validateModelDocument } from "@/lib/llm-output";
import { logger, errorFields } from "@/lib/logger";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = await request.json();

    const documentName = body.documentName as DocumentName;
    const currentContent = sanitizeText(body.currentContent || "", 50000);
    const userInstruction = sanitizeText(body.userInstruction || "", 5000);
    const mustHaves = validateMustHaves(body.mustHaves);

    if (!COP_GENERATION_ORDER.includes(documentName)) {
      return NextResponse.json(
        { error: "Invalid document name." },
        { status: 400 }
      );
    }

    if (!userInstruction.trim()) {
      return NextResponse.json(
        { error: "Instruction cannot be empty." },
        { status: 400 }
      );
    }

    if (containsPromptInjection(userInstruction)) {
      return NextResponse.json(
        {
          error: "Maaf, permintaan ini melanggar kebijakan keamanan kami.",
        },
        { status: 400 }
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

    return NextResponse.json({
      updatedContent: validated.content,
    });
  } catch (error) {
    logger.error("[/api/tweak] failed", {
      model: tweakModelName,
      durationMs: Date.now() - startedAt,
      ...errorFields(error),
    });
    return NextResponse.json(
      { error: "Perubahan belum dapat diterapkan. Silakan coba kembali." },
      { status: 500 }
    );
  }
}
