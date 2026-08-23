"use client";

import { cn } from "@/lib/utils";
import type { DocumentName } from "@/types/schema";
import type { DocumentProgressStatus } from "@/types/schema";
import { DOCUMENT_LABELS } from "@/types/schema";
import { CircleAlert, FileText } from "lucide-react";

interface DocumentTabProps {
  docName: DocumentName;
  isActive: boolean;
  onClick: () => void;
  status?: DocumentProgressStatus;
  index?: number;
}

export function DocumentTab({
  docName,
  isActive,
  onClick,
  status,
  index = 0,
}: DocumentTabProps) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      aria-controls={`document-panel-${docName}`}
      id={`document-tab-${docName}`}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        "group grid min-h-[68px] w-full grid-cols-[2rem_1fr_auto] items-center gap-2 border-b border-border px-3 text-left text-xs transition-colors",
        isActive
          ? "border-l-2 border-l-primary bg-primary/[0.08] text-foreground"
          : "text-muted-foreground hover:bg-surface hover:text-foreground"
      )}
    >
      <span className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{DOCUMENT_LABELS[docName]}</span>
        {status === "stale" && (
          <span className="mt-1 block font-mono text-[9px] uppercase tracking-wider text-amber-300">
            Perlu diselaraskan
          </span>
        )}
      </span>
      {status === "stale" && (
        <CircleAlert className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
      )}
      {status !== "stale" && <FileText className="h-3.5 w-3.5 opacity-45" aria-hidden="true" />}
    </button>
  );
}
