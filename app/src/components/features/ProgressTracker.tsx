"use client";

import { useAppStore } from "@/store/use-app-store";
import { MUST_HAVE_KEYS } from "@/types/schema";
import { cn } from "@/lib/utils";
import { Check, Circle, CircleDashed, TriangleAlert } from "lucide-react";
import { MUST_HAVE_UI_LABELS } from "@/lib/ui-copy";

interface ProgressTrackerProps {
  compact?: boolean;
}

export function ProgressTracker({ compact = false }: ProgressTrackerProps) {
  const discovery = useAppStore((state) => state.discovery);

  const filledCount = MUST_HAVE_KEYS.filter(
    (key) =>
      discovery[key].status === "confirmed" && !discovery[key].needsReview
  ).length;

  const progressPercent = Math.round((filledCount / MUST_HAVE_KEYS.length) * 100);

  return (
    <div className={cn("space-y-5", compact ? "px-4 py-3" : "p-5")}>
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Konteks proyek</span>
          <span
            className={cn(
              "font-mono font-semibold",
              filledCount === MUST_HAVE_KEYS.length
                ? "text-success"
                : "text-foreground"
            )}
          >
            {filledCount}/{MUST_HAVE_KEYS.length}
          </span>
        </div>
        <div className="h-px w-full bg-border">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out",
              filledCount === MUST_HAVE_KEYS.length
                ? "bg-success"
                : "bg-primary"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Variable checklist */}
      {!compact && <div className="space-y-1">
        {MUST_HAVE_KEYS.map((key) => {
          const isFilled =
            discovery[key].status === "confirmed" &&
            !discovery[key].needsReview;
          const isDraft =
            discovery[key].status === "draft" ||
            discovery[key].status === "recommended";
          const needsReview = discovery[key].needsReview;
          const StatusIcon = isFilled
            ? Check
            : needsReview
              ? TriangleAlert
              : isDraft
                ? CircleDashed
                : Circle;
          return (
            <div
              key={key}
              className={cn(
                "grid grid-cols-[1.25rem_1fr_auto] items-center gap-2 border-b border-border/60 px-1 py-2.5 text-xs transition-colors",
                isFilled
                  ? "text-foreground"
                  : needsReview
                    ? "text-amber-300"
                    : isDraft
                      ? "text-indigo-300"
                      : "text-muted-foreground"
              )}
            >
              <StatusIcon className={cn("h-3.5 w-3.5", isFilled && "text-success")} aria-hidden="true" />
              <span className="truncate">{MUST_HAVE_UI_LABELS[key]}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider">
                {isFilled ? "Terkonfirmasi" : needsReview ? "Tinjau" : isDraft ? "Draf" : "Belum"}
              </span>
            </div>
          );
        })}
      </div>}
    </div>
  );
}
