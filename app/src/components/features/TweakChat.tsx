"use client";

import * as React from "react";
import { useAppStore } from "@/store/use-app-store";
import { ChatInput } from "./ChatInput";
import { generateId, sanitizeInput, detectPromptInjection } from "@/lib/utils";
import type { DocumentName, ChatMessage } from "@/types/schema";
import { DOCUMENT_LABELS } from "@/types/schema";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp, PencilLine } from "lucide-react";
import { getAsyncFailureMessage } from "@/lib/ui-errors";

interface TweakChatProps {
  documentName: DocumentName;
}

interface TweakMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function TweakChat({ documentName }: TweakChatProps) {
  const {
    documents,
    updateDocument,
    markDocumentFresh,
    mustHaves,
    tweakMessages,
    addTweakMessage,
  } = useAppStore();
  const currentTweakMessages = tweakMessages[documentName] || [];
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const currentDoc = documents.find((doc) => doc.name === documentName);

  const handleTweakSubmit = async (content: string) => {
    const sanitized = sanitizeInput(content);

    if (detectPromptInjection(sanitized)) {
      addTweakMessage(documentName, {
        id: generateId(),
        role: "assistant",
        content:
          "Instruksi tersebut tidak dapat diterapkan karena mencoba mengubah aturan sistem. Jelaskan perubahan yang Anda inginkan pada isi dokumen.",
      });
      return;
    }

    const userMsg: TweakMessage = {
      id: generateId(),
      role: "user",
      content: sanitized,
    };
    addTweakMessage(documentName, userMsg);
    setIsLoading(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 115_000);

    try {
      const response = await fetch("/api/tweak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentName,
          currentContent: currentDoc?.content || "",
          userInstruction: sanitized,
          mustHaves,
        }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => null)) as {
        updatedContent?: string;
        error?: string;
      } | null;
      if (!response.ok || !data?.updatedContent?.trim()) {
        throw new Error(data?.error || `Tweak failed: ${response.status}`);
      }
      updateDocument(documentName, data.updatedContent);
      markDocumentFresh(documentName);

      const assistantMsg: TweakMessage = {
        id: generateId(),
        role: "assistant",
        content: `${DOCUMENT_LABELS[documentName]} telah diperbarui sesuai arahan Anda.`,
      };
      addTweakMessage(documentName, assistantMsg);
    } catch (error) {
      const errorMsg: TweakMessage = {
        id: generateId(),
        role: "assistant",
        content: getAsyncFailureMessage(error, "revision"),
      };
      addTweakMessage(documentName, errorMsg);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  return (
    <section className="no-print border-t border-border bg-background/95">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex min-h-12 w-full items-center justify-between px-4 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground sm:px-6"
        aria-expanded={isExpanded}
        aria-controls="document-revision-panel"
      >
        <span className="flex items-center gap-2">
          <PencilLine className="h-4 w-4" aria-hidden="true" />
          Revisi dokumen melalui arahan
        </span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {isExpanded && (
        <div id="document-revision-panel" className="animate-fade-in">
          {currentTweakMessages.length > 0 && (
            <div className="mx-auto max-h-44 max-w-4xl space-y-3 overflow-y-auto px-4 py-3 sm:px-6">
              {currentTweakMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "border-l px-3 py-2 text-xs leading-relaxed",
                    msg.role === "user"
                      ? "ml-8 border-primary bg-primary/[0.06] text-foreground"
                      : "mr-8 border-success bg-success/[0.035] text-foreground/80"
                  )}
                >
                  {msg.role === "assistant" && (
                    <Check className="mr-2 inline h-3.5 w-3.5 text-success" aria-hidden="true" />
                  )}
                  <span>{msg.content}</span>
                </div>
              ))}
            </div>
          )}

          <ChatInput
            onSubmit={handleTweakSubmit}
            disabled={isLoading}
            placeholder={`Jelaskan perubahan untuk ${DOCUMENT_LABELS[documentName]}...`}
          />
        </div>
      )}
    </section>
  );
}
