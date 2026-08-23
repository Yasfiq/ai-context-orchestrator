"use client";

import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/utils";
import type { ChatMessage } from "@/types/schema";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { CheckCircle2 } from "lucide-react";

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="my-7 flex items-center gap-3 animate-fade-in" role="status">
        <span className="h-px flex-1 bg-border" />
        <div className="flex max-w-lg items-center gap-2 px-2 text-center font-mono text-[11px] text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
          {message.content}
        </div>
        <span className="h-px flex-1 bg-border" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid w-full animate-slide-up",
        isUser ? "justify-items-end" : "justify-items-start"
      )}
    >
      <div
        className={cn(
          "relative text-sm leading-relaxed",
          isUser
            ? "w-fit max-w-[88%] border-r-2 border-primary bg-primary/10 px-4 py-3 text-foreground md:max-w-[70%]"
            : "w-full max-w-3xl border-l border-border py-1 pl-5 pr-2 text-card-foreground"
        )}
      >
        {!isUser && (
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-indigo-300">
              Context Architect
            </span>
            <span className="h-px w-8 bg-primary/70" />
          </div>
        )}
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <MarkdownRenderer content={message.content} variant="chat" />
        )}
        <div
          className={cn(
            "mt-3 font-mono text-[10px]",
            isUser ? "text-muted-foreground" : "text-muted-foreground/75"
          )}
        >
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
