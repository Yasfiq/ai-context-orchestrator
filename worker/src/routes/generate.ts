import { Hono } from "hono";
import { streamText } from "ai";
import { buildCopPrompt } from "@/prompts/cop-pipeline";
import {
  sanitizeText,
  validateMustHaves,
  containsPromptInjection,
} from "@/lib/sanitize";
import type { DocumentName } from "@/types/schema";
import { COP_GENERATION_ORDER, MUST_HAVE_KEYS } from "@/types/schema";
import { getUniversalLLM, getModelNames } from "@/lib/llm-provider";
import { validateModelDocument } from "@/lib/llm-output";
import { logger, errorFields } from "@/lib/logger";
import type { Env } from "@/types/env";

export const generateRoute = new Hono<{ Bindings: Env }>();

/**
 * POST /api/generate
 * Batch Chain of Prompts (CoP) document generation with SSE stream
 */
generateRoute.post("/", async (c) => {
  const { documentModelName } = getModelNames(c.env);
  const universalLLM = getUniversalLLM(c.env);

  try {
    const body = await c.req.json();
    const mustHaves = validateMustHaves(body.mustHaves);

    const allFilled = MUST_HAVE_KEYS.every(
      (key) => mustHaves[key] !== null && mustHaves[key]!.trim() !== ""
    );

    if (!allFilled) {
      return c.json(
        { error: "All 8 Must-Have variables must be filled before generating documents." },
        400
      );
    }

    if (MUST_HAVE_KEYS.some((key) => containsPromptInjection(mustHaves[key] || ""))) {
      return c.json(
        { error: "Input mengandung pola yang melanggar kebijakan keamanan." },
        400
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const previousDocuments: Record<string, string> = {};
        let stopped = c.req.raw.signal.aborted;
        c.req.raw.signal.addEventListener("abort", () => {
          stopped = true;
        });

        const enqueue = (payload: string) => {
          if (stopped) return false;
          try {
            controller.enqueue(encoder.encode(payload));
            return true;
          } catch {
            stopped = true;
            return false;
          }
        };

        for (const docName of COP_GENERATION_ORDER) {
          if (stopped) break;
          try {
            enqueue(
              `data: ${JSON.stringify({ type: "progress", document: docName })}\n\n`
            );

            const prompt = buildCopPrompt(
              docName,
              mustHaves,
              previousDocuments
            );

            const result = streamText({
              model: universalLLM(documentModelName),
              prompt,
              maxTokens: 4000,
              temperature: 0.6,
            });

            let content = "";
            for await (const textPart of result.textStream) {
              content += textPart;
            }

            const finishReason = await result.finishReason;
            const validated = validateModelDocument(content, finishReason);
            previousDocuments[docName] = validated.content;

            enqueue(
              `data: ${JSON.stringify({
                type: "document",
                name: docName,
                content: validated.content,
              })}\n\n`
            );
          } catch (docError) {
            logger.error("[/api/generate] document generation failed", {
              document: docName,
              ...errorFields(docError),
            });

            enqueue(
              `data: ${JSON.stringify({
                type: "error",
                document: docName,
                error: "Dokumen belum dapat disusun. Silakan coba kembali.",
              })}\n\n`
            );
            break;
          }
        }

        if (!stopped) {
          enqueue("data: [DONE]\n\n");
          try {
            controller.close();
          } catch {}
        }
      },
    });

    return c.newResponse(stream, 200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    });
  } catch (error) {
    logger.error("[/api/generate] request failed", errorFields(error));
    return c.json(
      { error: "Penyusunan dokumen belum dapat dimulai. Silakan coba kembali." },
      500
    );
  }
});

/**
 * POST /api/generate/single
 * Single document generation or retry
 */
generateRoute.post("/single", async (c) => {
  const startedAt = Date.now();
  const { documentModelName } = getModelNames(c.env);
  const universalLLM = getUniversalLLM(c.env);

  try {
    const body = await c.req.json();
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
      return c.json({ error: "Invalid document name." }, 400);
    }

    const mustHaves = validateMustHaves(body.mustHaves);
    const allFilled = MUST_HAVE_KEYS.every(
      (key) => mustHaves[key] !== null && mustHaves[key]!.trim() !== ""
    );

    if (!allFilled) {
      return c.json({ error: "All 8 Must-Have variables must be filled." }, 400);
    }

    if (MUST_HAVE_KEYS.some((key) => containsPromptInjection(mustHaves[key] || ""))) {
      return c.json(
        { error: "Input mengandung pola yang melanggar kebijakan keamanan." },
        400
      );
    }

    const prompt = buildCopPrompt(documentName, mustHaves, previousDocuments);

    const result = streamText({
      model: universalLLM(documentModelName),
      prompt,
      maxTokens: 4000,
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

    return c.json(
      {
        name: documentName,
        content: validated.content,
      },
      200,
      {
        "Server-Timing": `dur=${Date.now() - startedAt}`,
        "Cache-Control": "no-transform",
      }
    );
  } catch (error) {
    logger.error("[/api/generate/single] failed", {
      model: documentModelName,
      durationMs: Date.now() - startedAt,
      ...errorFields(error),
    });
    return c.json(
      { error: "Dokumen belum dapat disusun. Silakan coba kembali." },
      500
    );
  }
});
