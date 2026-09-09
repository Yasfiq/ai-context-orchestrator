"use client";

import * as React from "react";
import { useAppStore } from "@/store/use-app-store";
import { generateId, sanitizeInput, detectPromptInjection } from "@/lib/utils";
import { getAsyncFailureMessage } from "@/lib/ui-errors";
import type {
  ChatMessage,
  OnboardingApiResponse,
  OnboardingInputSource,
} from "@/types/schema";

const REQUEST_TIMEOUT_MS = 55_000;

const INJECTION_WARNING =
  "Permintaan tersebut tidak dapat diproses karena tidak berkaitan dengan penyusunan konteks proyek. Silakan jelaskan kebutuhan proyek Anda tanpa instruksi untuk mengubah aturan sistem.";

/**
 * Owns the onboarding turn lifecycle: input guarding, the /api/chat request,
 * and applying the response to the store. Keeps ZenTerminal purely presentational.
 */
export function useOnboardingChat() {
  const addMessage = useAppStore((state) => state.addMessage);
  const applyOnboardingResponse = useAppStore(
    (state) => state.applyOnboardingResponse
  );

  const [isLoading, setIsLoading] = React.useState(false);

  const sendMessage = React.useCallback(
    async (
      content: string,
      inputSource: OnboardingInputSource = "manual",
      selectedRecommendation = false
    ) => {
      const sanitized = sanitizeInput(content);

      if (detectPromptInjection(sanitized)) {
        addMessage({
          id: generateId(),
          role: "assistant",
          content: INJECTION_WARNING,
          timestamp: Date.now(),
        });
        return;
      }

      addMessage({
        id: generateId(),
        role: "user",
        content: sanitized,
        timestamp: Date.now(),
      });

      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
      );

      try {
        // Read after addMessage so the just-sent user turn is included.
        const state = useAppStore.getState();
        const payloadMessages = state.messages.map((message) => ({
          role: message.role,
          content: message.content,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: payloadMessages,
            mustHaves: state.mustHaves,
            discovery: state.discovery,
            sessionLanguage: state.sessionLanguage,
            languageLocked: state.languageLocked,
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
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: getAsyncFailureMessage(error, "onboarding"),
          timestamp: Date.now(),
          isError: true,
          failedContent: sanitized,
        };
        addMessage(errorMessage);
      } finally {
        window.clearTimeout(timeoutId);
        setIsLoading(false);
      }
    },
    [addMessage, applyOnboardingResponse]
  );

  const retryMessage = React.useCallback(
    async (failedContent: string, errorId?: string) => {
      if (errorId) {
        useAppStore.getState().removeMessage(errorId);
      }
      await sendMessage(failedContent, "manual", false);
    },
    [sendMessage]
  );

  return { isLoading, sendMessage, retryMessage };
}

/**
 * Seeds the welcome turn exactly once, after store hydration, and only when the
 * transcript is still empty.
 */
export function useWelcomeMessage(welcomeContent: string) {
  const hasHydrated = useAppStore((state) => state._hasHydrated);
  const addMessage = useAppStore((state) => state.addMessage);
  const hasInitialized = React.useRef(false);

  React.useEffect(() => {
    if (hasInitialized.current || !hasHydrated) return;
    hasInitialized.current = true;

    if (useAppStore.getState().messages.length > 0) return;

    addMessage({
      id: generateId(),
      role: "assistant",
      content: welcomeContent,
      timestamp: Date.now(),
    });
  }, [hasHydrated, addMessage, welcomeContent]);
}

/**
 * Keeps the transcript pinned to the latest turn without interrupting user reading,
 * and syncs the document language attribute with the active session language.
 */
export function useTranscriptView(
  dependencies: readonly unknown[],
  sessionLanguage: string
) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = React.useState(false);
  const isScrolledUpRef = React.useRef(false);

  const scrollToBottom = React.useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      messagesEndRef.current?.scrollIntoView({ behavior });
      setIsScrolledUp(false);
      isScrolledUpRef.current = false;
    },
    []
  );

  React.useEffect(() => {
    const sentinel = messagesEndRef.current;
    if (!sentinel) return;

    const scrollContainer =
      sentinel.closest("[data-radix-scroll-area-viewport]") ||
      sentinel.parentElement;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const scrolledAway = distanceFromBottom > 150;
      setIsScrolledUp(scrolledAway);
      isScrolledUpRef.current = scrolledAway;
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

  React.useEffect(() => {
    if (!isScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  React.useEffect(() => {
    document.documentElement.lang = sessionLanguage;
  }, [sessionLanguage]);

  return { messagesEndRef, isScrolledUp, scrollToBottom };
}
