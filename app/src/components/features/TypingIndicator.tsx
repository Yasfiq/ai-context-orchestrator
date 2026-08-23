"use client";

import { ScanSearch } from "lucide-react";

export function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-3 border-l border-primary px-4 py-3 text-sm text-muted-foreground animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <ScanSearch className="h-4 w-4 text-indigo-300" aria-hidden="true" />
      <span>Memeriksa kelengkapan jawaban...</span>
    </div>
  );
}
