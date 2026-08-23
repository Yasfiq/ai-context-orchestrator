import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { buildOnboardingSystemPrompt } from "@/prompts/onboarding-prompt";
import {
  containsPromptInjection,
  validateChatMessages,
  validateMustHaves,
} from "@/lib/sanitize";
import {
  createOnboardingFallback,
  createTechStackGuidance,
  getActiveDiscoveryVariable,
  normalizeDiscoveryState,
  parseOnboardingResponse,
  resolveSessionLanguage,
} from "@/lib/onboarding-discovery";
import type {
  MustHaveKey,
  OnboardingInputSource,
  SessionLanguage,
} from "@/types/schema";
import { chatModelName, universalLLM } from "@/lib/llm-provider";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let fallbackLanguage: SessionLanguage = "id";
  let fallbackActiveVariable: MustHaveKey = "projectVision";

  try {
    const body = await request.json();
    const messages = validateChatMessages(body.messages);
    const mustHaves = validateMustHaves(body.mustHaves);
    const discovery = normalizeDiscoveryState(body.discovery, mustHaves);
    const inputSource: OnboardingInputSource =
      body.inputSource === "suggestion" ? "suggestion" : "manual";
    const selectedRecommendation =
      inputSource === "suggestion" && body.selectedRecommendation === true;

    if (messages.length === 0) {
      return NextResponse.json(
        createOnboardingFallback("projectVision", "id"),
        { status: 400 }
      );
    }

    const currentLanguage: SessionLanguage =
      body.sessionLanguage === "en" ? "en" : "id";
    const language = resolveSessionLanguage(
      messages,
      currentLanguage,
      body.languageLocked === true
    );
    const activeVariable = getActiveDiscoveryVariable(mustHaves, discovery);
    fallbackLanguage = language;
    fallbackActiveVariable = activeVariable;
    const lastUserMessage =
      [...messages].reverse().find((message) => message.role === "user")
        ?.content || "";

    if (containsPromptInjection(lastUserMessage)) {
      const fallback = createOnboardingFallback(activeVariable, language);
      return NextResponse.json({
        ...fallback,
        reply:
          language === "id"
            ? "Maaf, permintaan ini melanggar kebijakan keamanan. Mari kembali ke kebutuhan proyek yang sedang kita bahas."
            : "Sorry, that request violates the security policy. Let us return to the project requirement we were discussing.",
      });
    }

    if (activeVariable === "techStackCore") {
      const response = createTechStackGuidance(
        lastUserMessage,
        discovery.techStackCore.draftValue,
        language,
        inputSource
      );
      console.info("[/api/chat] deterministic", {
        activeVariable,
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json(response);
    }

    const systemPrompt = buildOnboardingSystemPrompt(
      mustHaves,
      language,
      discovery,
      activeVariable,
      inputSource,
      selectedRecommendation
    );
    const recentMessages = messages
      .filter(
        (message) =>
          message.content &&
          (message.role === "user" || message.role === "assistant")
      )
      .slice(-8)
      .map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      }));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    try {
      const result = streamText({
        model: universalLLM(chatModelName),
        system: systemPrompt,
        messages: recentMessages,
        maxTokens: 1600,
        temperature: 0.25,
        abortSignal: controller.signal,
      });

      let responseText = "";
      for await (const textPart of result.textStream) {
        responseText += textPart;
      }

      const finishReason = await result.finishReason;
      const response =
        responseText.trim() && finishReason !== "length"
          ? parseOnboardingResponse(
              responseText,
              activeVariable,
              language,
              lastUserMessage,
              discovery[activeVariable].clarificationTurns,
              {
                currentDraft: discovery[activeVariable].draftValue,
                inputSource,
              }
            )
          : createOnboardingFallback(activeVariable, language);

      const correctionRequested =
        /\b(tadi|sebenarnya|koreksi|ubah|bukan|actually|correction|change)\b/i.test(
          lastUserMessage
        );
      for (const [rawKey, value] of Object.entries(
        response.confirmedUpdates
      )) {
        const key = rawKey as keyof typeof mustHaves;
        if (
          key !== activeVariable &&
          !(correctionRequested && Boolean(mustHaves[key]))
        ) {
          response.provisionalUpdates[key] = value;
          delete response.confirmedUpdates[key];
        }
      }

      console.info("[/api/chat] completed", {
        model: chatModelName,
        activeVariable,
        finishReason,
        durationMs: Date.now() - startedAt,
        responseChars: responseText.length,
      });

      return NextResponse.json(response);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/chat] failed", {
      model: chatModelName,
      durationMs: Date.now() - startedAt,
      error: errorMessage,
    });

    const isTimeout =
      errorMessage.includes("aborted") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("ETIMEDOUT");
    return NextResponse.json(
      {
        ...createOnboardingFallback(fallbackActiveVariable, fallbackLanguage),
        reply: isTimeout
          ? fallbackLanguage === "id"
            ? "Respons AI terlalu lama. Mari lanjutkan secara sederhana: jelaskan satu detail utama yang masih kurang dari bagian ini."
            : "The AI response took too long. Let us continue simply: clarify one key detail that is still missing from this section."
          : fallbackLanguage === "id"
            ? "Terjadi kendala saat memproses jawaban. Silakan coba lagi dengan satu detail utama tentang proyek Anda."
            : "There was a problem processing the answer. Please try again with one key detail about your project.",
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
