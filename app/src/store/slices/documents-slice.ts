import type { StateCreator } from "zustand";
import type { AppStore } from "@/store/app-store-types";
import type {
  DocumentName,
  DocumentProgressState,
  DocumentProgressStatus,
  GeneratedDocument,
  GenerationStatus,
} from "@/types/schema";
import {
  COP_GENERATION_ORDER,
  DOCUMENT_DEPENDENCIES,
} from "@/types/schema";

export interface DocumentsSlice {
  documents: GeneratedDocument[];
  documentHistory: Partial<Record<DocumentName, string[]>>;
  generationStatus: GenerationStatus;
  generationRunId: string | null;
  documentProgress: DocumentProgressState;
  currentGeneratingDoc: DocumentName | null;
  activeDocumentTab: DocumentName;
  setDocuments: (docs: GeneratedDocument[]) => void;
  updateDocument: (name: DocumentName, content: string) => void;
  undoDocument: (name: DocumentName) => boolean;
  canUndoDocument: (name: DocumentName) => boolean;
  setGenerationStatus: (status: GenerationStatus) => void;
  beginGenerationRun: (runId: string) => void;
  setDocumentProgress: (
    name: DocumentName,
    status: DocumentProgressStatus,
    runId: string
  ) => void;
  markDownstreamStale: (name: DocumentName) => void;
  markDocumentFresh: (name: DocumentName) => void;
  setCurrentGeneratingDoc: (name: DocumentName | null) => void;
  setActiveDocumentTab: (name: DocumentName) => void;
}

export const createInitialDocumentProgress = (): DocumentProgressState =>
  Object.fromEntries(
    COP_GENERATION_ORDER.map((name) => [name, "pending"])
  ) as DocumentProgressState;

function getDownstreamDocuments(source: DocumentName): DocumentName[] {
  const downstream = new Set<DocumentName>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const name of COP_GENERATION_ORDER) {
      if (name === source || downstream.has(name)) continue;
      const dependencies = DOCUMENT_DEPENDENCIES[name];
      if (
        dependencies.includes(source) ||
        dependencies.some((dependency) => downstream.has(dependency))
      ) {
        downstream.add(name);
        changed = true;
      }
    }
  }
  return [...downstream];
}

/**
 * Documents slice: generated CoP documents, revision history,
 * generation runs, progress tracking, and dependency staleness.
 */
export const createDocumentsSlice: StateCreator<
  AppStore,
  [],
  [],
  DocumentsSlice
> = (set, get) => ({
  documents: [],
  documentHistory: {},
  generationStatus: "idle",
  generationRunId: null,
  documentProgress: createInitialDocumentProgress(),
  currentGeneratingDoc: null,
  activeDocumentTab: "PRD",

  setDocuments: (documents) => set({ documents }),
  updateDocument: (name, content) => {
    const currentDoc = get().documents.find((doc) => doc.name === name);
    const currentHistory = get().documentHistory[name] || [];
    const newHistory = currentDoc
      ? [...currentHistory, currentDoc.content]
      : currentHistory;
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.name === name ? { ...doc, content, generatedAt: Date.now() } : doc
      ),
      documentHistory: { ...state.documentHistory, [name]: newHistory },
    }));
    get().markDownstreamStale(name);
  },

  undoDocument: (name) => {
    const history = get().documentHistory[name] || [];
    if (history.length === 0) return false;
    const previousContent = history[history.length - 1];
    const remainingHistory = history.slice(0, -1);
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.name === name
          ? { ...doc, content: previousContent, generatedAt: Date.now() }
          : doc
      ),
      documentHistory: {
        ...state.documentHistory,
        [name]: remainingHistory,
      },
    }));
    get().markDownstreamStale(name);
    return true;
  },
  canUndoDocument: (name) => (get().documentHistory[name] || []).length > 0,

  setGenerationStatus: (generationStatus) => set({ generationStatus }),
  beginGenerationRun: (generationRunId) =>
    set((state) => ({
      generationRunId,
      documentProgress: Object.fromEntries(
        COP_GENERATION_ORDER.map((name) => [
          name,
          state.documents.some((doc) => doc.name === name)
            ? state.documentProgress[name] === "stale"
              ? "stale"
              : "completed"
            : "pending",
        ])
      ) as DocumentProgressState,
    })),
  setDocumentProgress: (name, status, runId) =>
    set((state) => {
      if (state.generationRunId !== runId) return state;
      const current = state.documentProgress[name];
      const allowed =
        (current === "pending" && status === "generating") ||
        (current === "generating" && ["completed", "error"].includes(status)) ||
        (["error", "stale"].includes(current) && status === "generating");
      if (!allowed && current !== status) return state;
      return {
        documentProgress: { ...state.documentProgress, [name]: status },
      };
    }),
  markDownstreamStale: (name) =>
    set((state) => {
      const documentProgress = { ...state.documentProgress };
      for (const downstream of getDownstreamDocuments(name)) {
        if (state.documents.some((doc) => doc.name === downstream)) {
          documentProgress[downstream] = "stale";
        }
      }
      return { documentProgress };
    }),
  markDocumentFresh: (name) =>
    set((state) => ({
      documentProgress: {
        ...state.documentProgress,
        [name]: "completed",
      },
    })),

  setCurrentGeneratingDoc: (currentGeneratingDoc) =>
    set({ currentGeneratingDoc }),
  setActiveDocumentTab: (activeDocumentTab) => set({ activeDocumentTab }),
});
