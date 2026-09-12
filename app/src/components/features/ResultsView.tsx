"use client";

import * as React from "react";
import {
  Archive,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileDown,
  History,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { DocumentTab } from "./DocumentTab";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TweakChat } from "./TweakChat";
import { Button } from "@/components/ui/Button";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Toast } from "@/components/ui/Toast";
import {
  COP_GENERATION_ORDER,
  DOCUMENT_LABELS,
  type DocumentName,
} from "@/types/schema";
import {
  downloadAsMarkdown,
  downloadAllMarkdown,
  downloadCombinedMarkdown,
  downloadAsPdf,
} from "@/lib/export";
import { UI_COPY } from "@/lib/ui-copy";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
};

export function ResultsView() {
  const {
    documents,
    activeDocumentTab,
    setActiveDocumentTab,
    setPhase,
    undoDocument,
    canUndoDocument,
    updateDocument,
    markDocumentFresh,
    documentProgress,
    mustHaves,
  } = useAppStore();

  const [isRegenerating, setIsRegenerating] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const documentScrollRef = React.useRef<HTMLDivElement>(null);
  const [toast, setToast] = React.useState<ToastState>({
    message: "",
    type: "info",
    visible: false,
  });

  const activeDocument = documents.find((doc) => doc.name === activeDocumentTab);
  const hasUndo = canUndoDocument(activeDocumentTab);
  const activeStatus = documentProgress[activeDocumentTab];

  React.useLayoutEffect(() => {
    if (documentScrollRef.current) documentScrollRef.current.scrollTop = 0;
  }, [activeDocumentTab]);

  const showToast = (message: string, type: ToastState["type"]) => {
    setToast({ message, type, visible: true });
  };

  const handleCopyDocument = async () => {
    if (!activeDocument) return;
    try {
      await navigator.clipboard.writeText(activeDocument.content);
      setIsCopied(true);
      showToast(
        `Konten ${DOCUMENT_LABELS[activeDocumentTab]} disalin ke clipboard.`,
        "success"
      );
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showToast("Gagal menyalin dokumen ke clipboard.", "error");
    }
  };

  const handleDownloadMd = () => {
    if (!activeDocument) return;
    downloadAsMarkdown(activeDocument);
    showToast(`Unduhan ${activeDocument.filename} dimulai.`, "success");
  };

  const handleDownloadPdf = async () => {
    if (!activeDocument) return;
    try {
      await downloadAsPdf(activeDocument);
      showToast(
        `${activeDocument.filename.replace(".md", ".pdf")} siap diunduh.`,
        "success"
      );
    } catch {
      showToast("PDF belum dapat dibuat. Coba kembali dari dokumen ini.", "error");
    }
  };

  const handleDownloadAll = () => {
    downloadAllMarkdown(documents);
    showToast("Unduhan seluruh dokumen dimulai.", "info");
  };

  const handleDownloadBundle = () => {
    downloadCombinedMarkdown(documents);
    showToast("Dokumen gabungan siap diunduh.", "success");
  };

  const handleUndo = () => {
    if (undoDocument(activeDocumentTab)) {
      showToast(
        `${DOCUMENT_LABELS[activeDocumentTab]} dikembalikan ke versi sebelumnya.`,
        "info"
      );
    }
  };

  const handleRegenerateCurrent = async () => {
    if (!activeDocument || isRegenerating) return;
    setIsRegenerating(true);
    showToast(`Menyusun ulang ${DOCUMENT_LABELS[activeDocumentTab]}...`, "info");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 115_000);

    try {
      const previousDocuments: Record<string, string> = {};
      documents.forEach((document) => {
        if (document.name !== activeDocumentTab) {
          previousDocuments[document.name] = document.content;
        }
      });

      const response = await fetch("/api/generate/single", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          documentName: activeDocumentTab,
          mustHaves,
          previousDocuments,
          stream: false,
        }),
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => null)) as {
        content?: string;
      } | null;

      if (!response.ok || !data?.content?.trim()) {
        throw new Error("regeneration_failed");
      }

      updateDocument(activeDocumentTab, data.content);
      markDocumentFresh(activeDocumentTab);
      showToast(
        `${DOCUMENT_LABELS[activeDocumentTab]} selesai disusun ulang.`,
        "success"
      );
    } catch {
      showToast(
        `${DOCUMENT_LABELS[activeDocumentTab]} belum dapat disusun ulang. Coba kembali.`,
        "error"
      );
    } finally {
      window.clearTimeout(timeoutId);
      setIsRegenerating(false);
    }
  };

  const handleStartOver = () => {
    const confirmed = window.confirm(
      "Mulai ulang proyek? Seluruh konteks, dokumen, dan riwayat revisi pada sesi ini akan dihapus."
    );
    if (!confirmed) return;
    useAppStore.getState().resetAll();
    setPhase("onboarding");
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = COP_GENERATION_ORDER.indexOf(activeDocumentTab);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? COP_GENERATION_ORDER.length - 1
          : event.key === "ArrowDown"
            ? (currentIndex + 1) % COP_GENERATION_ORDER.length
            : (currentIndex - 1 + COP_GENERATION_ORDER.length) %
              COP_GENERATION_ORDER.length;
    const nextDocument = COP_GENERATION_ORDER[nextIndex];
    setActiveDocumentTab(nextDocument);
    requestAnimationFrame(() =>
      document.getElementById(`document-tab-${nextDocument}`)?.focus()
    );
  };

  return (
    <div className="workspace-frame flex h-[100dvh] flex-col overflow-hidden">
      <header className="no-print flex min-h-[78px] flex-col justify-center gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="eyebrow">Workspace / 03</p>
          <div className="mt-1 flex items-baseline gap-3">
            <h1 className="text-base font-semibold text-foreground">{UI_COPY.results.title}</h1>
            <span className="font-mono text-[10px] text-muted-foreground">
              {documents.length} dokumen
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <Button variant="ghost" size="sm" onClick={handleDownloadBundle} aria-label={UI_COPY.results.downloadBundle}>
            <Archive className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">{UI_COPY.results.downloadBundle}</span>
            <span className="lg:hidden">Gabungan</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownloadAll} aria-label={UI_COPY.results.downloadAll}>
            <Download className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">{UI_COPY.results.downloadAll}</span>
            <span className="lg:hidden">Semua</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleStartOver}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">{UI_COPY.results.startOver}</span>
          </Button>
        </div>
      </header>

      <div className="no-print border-b border-border p-3 md:hidden">
        <label className="relative block">
          <span className="sr-only">Pilih dokumen</span>
          <select
            value={activeDocumentTab}
            onChange={(event) => setActiveDocumentTab(event.target.value as DocumentName)}
            className="min-h-11 w-full appearance-none border border-border bg-surface px-3 pr-10 text-sm text-foreground focus-visible:border-indigo-400 focus-visible:outline-none"
          >
            {COP_GENERATION_ORDER.map((documentName) => (
              <option key={documentName} value={documentName}>
                {DOCUMENT_LABELS[documentName]}
                {documentProgress[documentName] === "stale"
                  ? " - perlu diselaraskan"
                  : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </label>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="no-print hidden w-72 flex-none border-r border-border bg-background/55 md:block">
          <div className="border-b border-border px-4 py-5">
            <p className="eyebrow">Indeks dokumen</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {UI_COPY.results.guidance}
            </p>
          </div>
          <div role="tablist" aria-label="Dokumen proyek" onKeyDown={handleTabKeyDown}>
            {COP_GENERATION_ORDER.map((documentName, index) => (
              <DocumentTab
                key={documentName}
                docName={documentName}
                index={index}
                isActive={activeDocumentTab === documentName}
                status={documentProgress[documentName]}
                onClick={() => setActiveDocumentTab(documentName)}
              />
            ))}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {activeDocument ? (
            <>
              <div className="no-print flex flex-col gap-3 border-b border-border bg-background/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-foreground">
                    {DOCUMENT_LABELS[activeDocumentTab]}
                  </h2>
                  <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                    {activeDocument.filename} / {new Date(activeDocument.generatedAt).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {hasUndo && (
                    <Button variant="ghost" size="sm" onClick={handleUndo} title="Batalkan revisi terakhir">
                      <History className="h-4 w-4" aria-hidden="true" />
                      Batalkan
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerateCurrent}
                    disabled={isRegenerating}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} aria-hidden="true" />
                    {isRegenerating ? "Menyusun..." : UI_COPY.results.regenerate}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyDocument}
                    aria-label={`Salin dokumen ${DOCUMENT_LABELS[activeDocumentTab]}`}
                    title={`Salin markdown ${DOCUMENT_LABELS[activeDocumentTab]}`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                        <span className="text-emerald-400">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" aria-hidden="true" />
                        <span>Salin</span>
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadMd} aria-label="Unduh Markdown">
                    <FileDown className="h-4 w-4" aria-hidden="true" />
                    .md
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadPdf} aria-label="Unduh PDF">
                    <FileDown className="h-4 w-4" aria-hidden="true" />
                    .pdf
                  </Button>
                </div>
              </div>

              {activeStatus === "stale" && (
                <div className="no-print border-b border-amber-400/30 bg-amber-400/[0.07] px-4 py-3 text-xs leading-relaxed text-amber-200 sm:px-6" role="status">
                  Dokumen ini memakai konteks lama. Susun ulang untuk menyelaraskannya dengan perubahan terbaru.
                </div>
              )}

              <ScrollArea
                ref={documentScrollRef}
                id={`document-panel-${activeDocumentTab}`}
                role="tabpanel"
                aria-labelledby={`document-tab-${activeDocumentTab}`}
                data-testid="document-scroll-area"
                className="flex-1 [overflow-anchor:none]"
              >
                <article className="mx-auto w-full max-w-[860px] px-5 py-8 sm:px-10 md:py-12">
                  <MarkdownRenderer content={activeDocument.content} />
                </article>
              </ScrollArea>

              <TweakChat documentName={activeDocumentTab} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Belum ada dokumen yang dapat dibaca.
            </div>
          )}
        </main>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() =>
          setToast((previous) => ({ ...previous, visible: false }))
        }
      />
    </div>
  );
}
