"use client";

import * as React from "react";
import { useAppStore } from "@/store/use-app-store";
import {
  COP_GENERATION_ORDER,
  DOCUMENT_LABELS,
  DOCUMENT_FILENAMES,
  type DocumentName,
  type GeneratedDocument,
} from "@/types/schema";
import { cn } from "@/lib/utils";
import { generateId } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Circle,
  CircleAlert,
  FileText,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UI_COPY } from "@/lib/ui-copy";
import { getAsyncFailureMessage } from "@/lib/ui-errors";

export function GenerationProgress() {
  const {
    mustHaves,
    setDocuments,
    generationStatus,
    setGenerationStatus,
    documentProgress,
    beginGenerationRun,
    setDocumentProgress,
    currentGeneratingDoc,
    setCurrentGeneratingDoc,
    setPhase,
  } = useAppStore();

  const [error, setError] = React.useState<string | null>(null);
  const [docDurations, setDocDurations] = React.useState<Partial<Record<DocumentName, number>>>({});
  const [activeDocElapsed, setActiveDocElapsed] = React.useState(0);
  const [totalElapsed, setTotalElapsed] = React.useState(0);
  const [failedDoc, setFailedDoc] = React.useState<DocumentName | null>(null);

  const startedRef = React.useRef(false);
  const furthestProgressIndexRef = React.useRef(-1);
  const activeControllerRef = React.useRef<AbortController | null>(null);
  const totalStartTimeRef = React.useRef<number | null>(null);
  const activeDocStartTimeRef = React.useRef<number | null>(null);

  const totalDocs = COP_GENERATION_ORDER.length;
  const completedCount = COP_GENERATION_ORDER.filter(
    (name) => documentProgress[name] === "completed"
  ).length;
  const isComplete = completedCount === totalDocs;
  const progressPercent = Math.round((completedCount / totalDocs) * 100);

  // Live timer tick for active document and total generation
  React.useEffect(() => {
    if (generationStatus !== "generating") return;

    const intervalId = window.setInterval(() => {
      if (activeDocStartTimeRef.current) {
        const elapsed = Math.max(
          0,
          Math.floor((Date.now() - activeDocStartTimeRef.current) / 1000)
        );
        setActiveDocElapsed(elapsed);
      }
      if (totalStartTimeRef.current) {
        const total = Math.max(
          0,
          Math.floor((Date.now() - totalStartTimeRef.current) / 1000)
        );
        setTotalElapsed(total);
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [generationStatus]);

  React.useEffect(() => {
    let disposed = false;
    const startupTimer = window.setTimeout(() => {
      if (disposed || startedRef.current) return;
      startedRef.current = true;
      void startGeneration();
    }, 0);

    return () => {
      disposed = true;
      window.clearTimeout(startupTimer);
      activeControllerRef.current?.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startGeneration = async () => {
    const runId = generateId();
    startedRef.current = true;
    beginGenerationRun(runId);
    setGenerationStatus("generating");
    setError(null);
    setFailedDoc(null);
    setCurrentGeneratingDoc(null);
    furthestProgressIndexRef.current = -1;
    if (!totalStartTimeRef.current) {
      totalStartTimeRef.current = Date.now();
    }

    try {
      const storedDocuments = useAppStore.getState().documents;
      const generatedDocs = COP_GENERATION_ORDER.map((name) =>
        storedDocuments.find(
          (doc) => doc.name === name && doc.content.trim().length > 0
        )
      ).filter(Boolean) as GeneratedDocument[];

      setDocuments(generatedDocs);

      for (const docName of COP_GENERATION_ORDER) {
        if (
          useAppStore.getState().documentProgress[docName] === "completed" &&
          generatedDocs.some((doc) => doc.name === docName)
        ) {
          continue;
        }

        const nextIndex = COP_GENERATION_ORDER.indexOf(docName);
        if (nextIndex > furthestProgressIndexRef.current) {
          furthestProgressIndexRef.current = nextIndex;
          setCurrentGeneratingDoc(docName);
        }
        setDocumentProgress(docName, "generating", runId);
        activeDocStartTimeRef.current = Date.now();
        setActiveDocElapsed(0);

        const previousDocuments = Object.fromEntries(
          generatedDocs.map((doc) => [doc.name, doc.content])
        );

        // Resilient fetch with 1 automatic retry on transient error
        let data: { content?: string; error?: string } | null = null;
        const maxAttempts = 2;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          const controller = new AbortController();
          activeControllerRef.current = controller;
          const timeoutId = window.setTimeout(() => controller.abort(), 140_000);

          try {
            const response = await fetch("/api/generate/single", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                documentName: docName,
                mustHaves,
                previousDocuments,
              }),
              signal: controller.signal,
            });

            data = (await response.json().catch(() => null)) as {
              content?: string;
              error?: string;
            } | null;

            if (!response.ok || !data?.content?.trim()) {
              throw new Error(
                data?.error || `${DOCUMENT_LABELS[docName]} belum dapat disusun.`
              );
            }
            break;
          } catch (attemptErr) {
            if (attempt >= maxAttempts) {
              throw attemptErr;
            }
            // Brief backoff before automatic retry
            await new Promise((resolve) => window.setTimeout(resolve, 1000));
          } finally {
            window.clearTimeout(timeoutId);
            if (activeControllerRef.current === controller) {
              activeControllerRef.current = null;
            }
          }
        }

        if (useAppStore.getState().generationRunId !== runId) return;

        const durationSec = Math.max(
          1,
          Math.round(
            (Date.now() - (activeDocStartTimeRef.current || Date.now())) / 1000
          )
        );
        setDocDurations((prev) => ({ ...prev, [docName]: durationSec }));
        activeDocStartTimeRef.current = null;

        const generatedDocument = {
          name: docName,
          filename: DOCUMENT_FILENAMES[docName],
          content: data!.content!,
          generatedAt: Date.now(),
        } satisfies GeneratedDocument;

        const existingIndex = generatedDocs.findIndex(
          (doc) => doc.name === docName
        );
        if (existingIndex >= 0) {
          generatedDocs[existingIndex] = generatedDocument;
        } else {
          generatedDocs.push(generatedDocument);
        }

        const orderedDocs = COP_GENERATION_ORDER.map((name) =>
          generatedDocs.find((doc) => doc.name === name)
        ).filter(Boolean) as GeneratedDocument[];

        // Persist every completed step so a retry resumes from the failed document.
        setDocuments(orderedDocs);
        setDocumentProgress(docName, "completed", runId);
      }

      if (generatedDocs.length !== totalDocs) {
        throw new Error("Penyusunan berhenti sebelum seluruh dokumen selesai.");
      }

      if (totalStartTimeRef.current) {
        const finalTotal = Math.max(
          1,
          Math.round((Date.now() - totalStartTimeRef.current) / 1000)
        );
        setTotalElapsed(finalTotal);
      }

      setGenerationStatus("completed");
      setCurrentGeneratingDoc(null);

      setTimeout(() => {
        if (useAppStore.getState().generationRunId === runId) {
          setPhase("results");
        }
      }, 800);
    } catch (err) {
      const activeDoc = useAppStore.getState().currentGeneratingDoc;
      if (activeDoc) {
        setDocumentProgress(activeDoc, "error", runId);
        setFailedDoc(activeDoc);
      }
      setGenerationStatus("error");
      setCurrentGeneratingDoc(null);
      setError(getAsyncFailureMessage(err, "generation"));
    }
  };

  const statusText = isComplete
    ? `${UI_COPY.generation.complete}${totalElapsed > 0 ? ` (${totalElapsed}s)` : ""}`
    : currentGeneratingDoc
      ? `Menyusun ${DOCUMENT_LABELS[currentGeneratingDoc]}... (${activeDocElapsed}s)`
      : UI_COPY.generation.preparing;

  return (
    <main className="workspace-frame min-h-[100dvh] px-4 py-8 sm:px-6 md:py-14">
      <div className="mx-auto w-full max-w-4xl">
        <header className="grid gap-8 border-b border-border pb-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="eyebrow">Workspace / 02</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {UI_COPY.generation.title}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground" role="status" aria-live="polite">
              {statusText}
            </p>
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className={cn("text-3xl", isComplete ? "text-success" : "text-foreground")}>{completedCount}</span>
            <span className="text-sm text-muted-foreground">/ {totalDocs} dokumen</span>
          </div>
        </header>

        <div className="my-8 h-px w-full overflow-hidden bg-border" aria-hidden="true">
            <div
              className={cn(
                "h-full transition-all duration-500 ease-out",
                isComplete ? "bg-success" : "bg-primary"
              )}
              style={{ width: `${progressPercent}%` }}
            />
        </div>

        <ol className="border-t border-border">
          {COP_GENERATION_ORDER.map((docName, index) => {
            const status = documentProgress[docName];
            const isCompleted = status === "completed";
            const isCurrent =
              status === "generating" && currentGeneratingDoc === docName;
            const isPending = status === "pending";
            const isError = status === "error";
            const isStale = status === "stale";

            const StatusIcon = isCompleted
              ? Check
              : isCurrent
                ? LoaderCircle
                : isError
                  ? CircleAlert
                  : isStale
                    ? RefreshCw
                    : Circle;

            return (
              <li
                key={docName}
                className={cn(
                  "grid min-h-20 grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-border px-2 transition-colors sm:px-4",
                  isCompleted && "bg-success/[0.025]",
                  isCurrent && "border-l-2 border-l-primary bg-primary/[0.06]",
                  isPending && "opacity-55",
                  isError && "bg-destructive/[0.06]",
                  isStale && "bg-amber-400/[0.04]"
                )}
              >
                <span className="font-mono text-[11px] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isCompleted && "text-success",
                      isCurrent && "text-foreground",
                      isPending && "text-muted-foreground",
                      isError && "text-destructive",
                      isStale && "text-amber-400"
                    )}
                  >
                    {DOCUMENT_LABELS[docName]}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {DOCUMENT_FILENAMES[docName]}
                  </p>
                </div>
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="hidden sm:inline">
                    {isCompleted
                      ? `Selesai ${docDurations[docName] ? `(${docDurations[docName]}s)` : ""}`
                      : isCurrent
                        ? `Diproses (${activeDocElapsed}s)`
                        : isError
                          ? "Gagal"
                          : isStale
                            ? "Perlu disusun ulang"
                            : "Menunggu"}
                  </span>
                  <StatusIcon
                    className={cn(
                      "h-4 w-4",
                      isCompleted && "text-success",
                      isCurrent && "animate-spin text-indigo-300",
                      isError && "text-destructive",
                      isStale && "text-amber-300"
                    )}
                    aria-hidden="true"
                  />
                </span>
              </li>
            );
          })}
        </ol>

        {error && (
          <div className="mt-8 border-l-2 border-destructive bg-destructive/[0.07] p-5 text-sm text-foreground" role="alert">
            <div className="flex gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 flex-none text-destructive" aria-hidden="true" />
              <div>
                <p className="font-semibold">Penyusunan dokumen terhenti</p>
                <p className="mt-2 break-words text-xs leading-relaxed text-muted-foreground">{error}</p>
                {completedCount > 0 && (
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    ✓ {completedCount} dari {totalDocs} dokumen telah aman tersimpan.
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={() => {
                startedRef.current = false;
                void startGeneration();
              }}
              className="mt-4"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {failedDoc
                ? `Lanjutkan penyusunan dari ${DOCUMENT_LABELS[failedDoc]}`
                : UI_COPY.generation.retry}
            </Button>
          </div>
        )}

        {generationStatus === "completed" && (
          <div className="mt-8 flex items-center justify-between border-y border-success/40 bg-success/[0.035] px-4 py-4 animate-fade-in" role="status">
            <span className="flex items-center gap-3 text-sm font-medium text-success">
              <FileText className="h-4 w-4" aria-hidden="true" />
              {UI_COPY.generation.complete} {totalElapsed > 0 ? `(${totalElapsed}s)` : ""}
            </span>
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {UI_COPY.generation.redirecting}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
