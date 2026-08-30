import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { buildCopPrompt } from "@/prompts/cop-pipeline";
import { sanitizeText, validateMustHaves } from "@/lib/sanitize";
import type { DocumentName } from "@/types/schema";
import { COP_GENERATION_ORDER, MUST_HAVE_KEYS } from "@/types/schema";
import { documentModelName, universalLLM } from "@/lib/llm-provider";
import { validateModelDocument } from "@/lib/llm-output";
import { logger, errorFields } from "@/lib/logger";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = await request.json();
    const documentName = body.documentName as DocumentName;
    const rawPreviousDocuments =
      body.previousDocuments && typeof body.previousDocuments === "object"
        ? (body.previousDocuments as Record<string, unknown>)
        : {};
    const previousDocuments = Object.fromEntries(
      COP_GENERATION_ORDER.flatMap((name) => {
        const value = rawPreviousDocuments[name];
        return typeof value === "string"
          ? [[name, sanitizeText(value, 50_000)]]
          : [];
      })
    );

    if (!COP_GENERATION_ORDER.includes(documentName)) {
      return NextResponse.json(
        { error: "Invalid document name." },
        { status: 400 }
      );
    }

    const mustHaves = validateMustHaves(body.mustHaves);
    const allFilled = MUST_HAVE_KEYS.every(
      (key) => mustHaves[key] !== null && mustHaves[key]!.trim() !== ""
    );

    if (!allFilled) {
      return NextResponse.json(
        { error: "All 8 Must-Have variables must be filled." },
        { status: 400 }
      );
    }

    const prompt = buildCopPrompt(documentName, mustHaves, previousDocuments);

    const result = streamText({
      model: universalLLM(documentModelName),
      prompt,
      maxTokens: 8000,
      temperature: 0.6,
    });

    let content = "";
    for await (const textPart of result.textStream) {
      content += textPart;
    }

    const finishReason = await result.finishReason;
    const validated = validateModelDocument(content, finishReason);

    logger.info("[/api/generate/single] completed", {
      model: documentModelName,
      documentName,
      finishReason,
      durationMs: Date.now() - startedAt,
      outputChars: validated.content.length,
    });

    return NextResponse.json({
      name: documentName,
      content: validated.content,
    });
  } catch (error) {
    logger.error("[/api/generate/single] failed", {
      model: documentModelName,
      durationMs: Date.now() - startedAt,
      ...errorFields(error),
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Dokumen belum dapat disusun.",
      },
      { status: 500 }
    );
  }
}
