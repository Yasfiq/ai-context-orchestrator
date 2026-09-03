import { NextRequest } from "next/server";
import { streamText } from "ai";
import { buildCopPrompt } from "@/prompts/cop-pipeline";
import { validateMustHaves, containsPromptInjection } from "@/lib/sanitize";
import type { DocumentName } from "@/types/schema";
import { COP_GENERATION_ORDER, MUST_HAVE_KEYS } from "@/types/schema";
import { documentModelName, universalLLM } from "@/lib/llm-provider";
import { validateModelDocument } from "@/lib/llm-output";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mustHaves = validateMustHaves(body.mustHaves);

    const allFilled = MUST_HAVE_KEYS.every(
      (key) => mustHaves[key] !== null && mustHaves[key]!.trim() !== ""
    );

    if (!allFilled) {
      return new Response(
        JSON.stringify({
          error: "All 8 Must-Have variables must be filled before generating documents.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (MUST_HAVE_KEYS.some((key) => containsPromptInjection(mustHaves[key] || ""))) {
      return new Response(
        JSON.stringify({
          error: "Input mengandung pola yang melanggar kebijakan keamanan.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const previousDocuments: Record<string, string> = {};
        let stopped = request.signal.aborted;
        request.signal.addEventListener("abort", () => {
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
              maxTokens: 8000,
              temperature: 0.6,
            });

            // Buffer the full stream on server side
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
            console.error(
              `[/api/generate] Error generating ${docName}:`,
              docError
            );

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

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[/api/generate] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Penyusunan dokumen belum dapat dimulai. Silakan coba kembali.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
