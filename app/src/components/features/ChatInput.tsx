"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  disabled = false,
  placeholder = "Tulis jawaban Anda...",
}: ChatInputProps) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length === 0 || disabled) return;
    onSubmit(trimmed);
    setValue("");
    resetTextareaHeight();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        160
      )}px`;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:px-6"
    >
      <div className="mx-auto flex max-w-4xl items-end gap-3 border border-border bg-surface p-2 transition-colors focus-within:border-indigo-400">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={cn(
            "max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-base leading-relaxed text-foreground sm:text-sm",
            "placeholder:text-muted-foreground focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
        <Button
          type="submit"
          disabled={disabled || value.trim().length === 0}
          size="icon"
          className="flex-shrink-0"
          aria-label="Kirim jawaban"
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <p className="mx-auto mt-2 max-w-4xl font-mono text-[10px] text-muted-foreground">
        Enter untuk mengirim / Shift + Enter untuk baris baru
      </p>
    </form>
  );
}
