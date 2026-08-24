"use client";

import * as React from "react";
import { useAppStore } from "@/store/use-app-store";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { ProgressTracker } from "./ProgressTracker";
import { OnboardingReview } from "./OnboardingReview";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Button } from "@/components/ui/Button";
import { generateId, sanitizeInput, detectPromptInjection } from "@/lib/utils";
import { ArrowRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { UI_COPY } from "@/lib/ui-copy";
import { getAsyncFailureMessage } from "@/lib/ui-errors";
import type {
  ChatMessage,
  OnboardingApiResponse,
  OnboardingInputSource,
} from "@/types/schema";

export function ZenTerminal() {
  const {
    messages,
    addMessage,
    discovery,
    activeVariable,
    suggestedReplies,
    sessionLanguage,
    applyOnboardingResponse,
    isOnboardingComplete,
    onboardingConfirmed,
    setPhase,
  } = useAppStore();

  const [isLoading, setIsLoading] = React.useState(false);
  const [showSidebar, setShowSidebar] = React.useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const hasInitialized = React.useRef(false);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  React.useEffect(() => {
    document.documentElement.lang = sessionLanguage;
  }, [sessionLanguage]);

  const _hasHydrated = useAppStore((state) => state._hasHydrated);

  React.useEffect(() => {
    // Only initialize welcome message once after store hydration is ready and if no messages exist
    if (!hasInitialized.current && _hasHydrated) {
      const currentMessages = useAppStore.getState().messages;
      if (currentMessages.length === 0) {
        hasInitialized.current = true;
        const welcomeMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: UI_COPY.onboarding.welcome,
          timestamp: Date.now(),
        };
        addMessage(welcomeMessage);
      } else {
        hasInitialized.current = true;
      }
    }
  }, [_hasHydrated, addMessage]);

  const handleSendMessage = async (
    content: string,
    inputSource: OnboardingInputSource = "manual",
    selectedRecommendation = false
  ) => {
    const sanitized = sanitizeInput(content);

    if (detectPromptInjection(sanitized)) {
      const warningMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content:
          "Permintaan tersebut tidak dapat diproses karena tidak berkaitan dengan penyusunan konteks proyek. Silakan jelaskan kebutuhan proyek Anda tanpa instruksi untuk mengubah aturan sistem.",
        timestamp: Date.now(),
      };
      addMessage(warningMessage);
      return;
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: sanitized,
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    setIsLoading(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 55_000);

    try {
      // Use messages directly from store (userMessage is already appended by addMessage)
      const payloadMessages = useAppStore.getState().messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          mustHaves: useAppStore.getState().mustHaves,
          discovery: useAppStore.getState().discovery,
          sessionLanguage: useAppStore.getState().sessionLanguage,
          languageLocked: useAppStore.getState().languageLocked,
          inputSource,
          selectedRecommendation,
        }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => null)) as
        | OnboardingApiResponse
        | null;
      if (!data?.reply) throw new Error(`API error: ${response.status}`);

      addMessage({
        id: generateId(),
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
      });
      applyOnboardingResponse(data);
    } catch (error) {
      console.error("[handleSendMessage] Error:", error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: getAsyncFailureMessage(error, "onboarding"),
        timestamp: Date.now(),
      };
      addMessage(errorMessage);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleGenerateDocuments = () => {
    setPhase("generating");
  };

  return (
    <div className="workspace-frame flex h-[100dvh] overflow-hidden">
      {showSidebar && (
        <aside className="hidden w-80 flex-shrink-0 border-r border-border bg-background/70 md:flex md:flex-col">
          <div className="border-b border-border px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Workspace / 01</p>
                <h2 className="mt-2 text-sm font-semibold text-foreground">Peta keputusan</h2>
              </div>
            <button
              onClick={() => setShowSidebar(false)}
                className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                aria-label="Sembunyikan panel konteks"
            >
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            </button>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Delapan keputusan yang menjadi dasar seluruh dokumen proyek.
            </p>
          </div>
          <ProgressTracker />

          {onboardingConfirmed && (
            <div className="mt-auto border-t border-border p-5">
              <Button
                onClick={handleGenerateDocuments}
                variant="success"
                className="w-full"
              >
                {UI_COPY.onboarding.generate}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[76px] items-center justify-between border-b border-border px-4 md:px-6">
          <div className="flex items-center gap-3">
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                className="hidden h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-surface hover:text-foreground md:flex"
                aria-label="Tampilkan panel konteks"
              >
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            <div>
              <p className="eyebrow">{UI_COPY.productName}</p>
              <h1 className="mt-1 text-base font-semibold tracking-tight text-foreground">
                {UI_COPY.workspaceName}
              </h1>
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Tahap aktif</p>
            <p className="mt-1 text-xs text-foreground">Pendalaman konteks</p>
          </div>
        </header>

        <ScrollArea className="flex-1 [overflow-anchor:none]">
          <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-10 md:py-12">
            <div className="mb-10 grid gap-3 border-b border-border pb-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="eyebrow">Sesi perumusan</p>
                <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  Ubah ide kasar menjadi keputusan yang dapat dibangun.
                </h2>
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-muted-foreground sm:text-right">
                AI akan mempertanyakan bagian yang ambigu sebelum menerimanya sebagai konteks proyek.
              </p>
            </div>

            <div className="space-y-7">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {isOnboardingComplete && !onboardingConfirmed && (
              <div className="mt-8">
                <OnboardingReview
                  onConfirmed={() =>
                    addMessage({
                      id: generateId(),
                      role: "system",
                      content: "Konteks proyek telah dikonfirmasi. Dokumen siap disusun.",
                      timestamp: Date.now(),
                    })
                  }
                />
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border bg-background/95 md:hidden">
          <ProgressTracker compact />
          {onboardingConfirmed && (
            <div className="px-4 pb-3">
              <Button
                onClick={handleGenerateDocuments}
                variant="success"
                className="w-full"
              >
                {UI_COPY.onboarding.generate}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>

        {suggestedReplies.length > 0 && !isLoading && !onboardingConfirmed && (
          <div className="border-t border-border bg-surface/90 px-4 py-4 md:px-6">
            <div className="mx-auto grid max-w-4xl gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
            {suggestedReplies.map((suggestion, index) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() =>
                  void handleSendMessage(
                    suggestion.value,
                    "suggestion",
                    suggestion.recommended === true
                  )
                }
                className="group grid min-h-16 grid-cols-[2rem_1fr] gap-2 bg-background px-3 py-3 text-left text-xs text-foreground transition-colors hover:bg-primary/10 focus-visible:z-10"
              >
                <span className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                <span>
                  {suggestion.recommended && (
                    <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-success">
                      {sessionLanguage === "id" ? "Rekomendasi:" : "Recommended:"}
                    </span>
                  )}
                  <span className="leading-relaxed">{suggestion.label}</span>
                </span>
              </button>
            ))}
            </div>
          </div>
        )}

        <ChatInput
          onSubmit={handleSendMessage}
          disabled={isLoading}
          placeholder={
            onboardingConfirmed
              ? "Konteks sudah dikonfirmasi. Anda masih dapat memberi koreksi."
              : discovery[activeVariable].needsReview
                ? "Jelaskan koreksi untuk bagian yang ditinjau ulang..."
                : sessionLanguage === "id"
                  ? UI_COPY.onboarding.inputPlaceholder
                  : "Share one detail about your project..."
          }
        />
      </div>
    </div>
  );
}
