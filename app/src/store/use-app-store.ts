import { create } from "zustand";
import type {
  ChatMessage,
  DiscoveryEntry,
  DiscoveryState,
  DocumentName,
  DocumentProgressState,
  DocumentProgressStatus,
  GeneratedDocument,
  GenerationStatus,
  MustHaveKey,
  MustHavesState,
  OnboardingApiResponse,
  SessionLanguage,
  SuggestedReply,
} from "@/types/schema";
import {
  COP_GENERATION_ORDER,
  DOCUMENT_DEPENDENCIES,
  MUST_HAVE_KEYS,
} from "@/types/schema";

export type AppPhase = "onboarding" | "generating" | "results";

export interface TweakMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AppStore {
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;
  mustHaves: MustHavesState;
  discovery: DiscoveryState;
  activeVariable: MustHaveKey;
  suggestedReplies: SuggestedReply[];
  sessionLanguage: SessionLanguage;
  languageLocked: boolean;
  onboardingConfirmed: boolean;
  updateMustHave: (key: MustHaveKey, value: string) => void;
  applyOnboardingResponse: (response: OnboardingApiResponse) => void;
  reopenVariable: (key: MustHaveKey) => void;
  setSessionLanguage: (language: SessionLanguage, locked?: boolean) => void;
  confirmOnboarding: () => boolean;
  resetMustHaves: () => void;
  isOnboardingComplete: boolean;
  checkOnboardingComplete: () => void;
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  documents: GeneratedDocument[];
  setDocuments: (docs: GeneratedDocument[]) => void;
  updateDocument: (name: DocumentName, content: string) => void;
  undoDocument: (name: DocumentName) => boolean;
  canUndoDocument: (name: DocumentName) => boolean;
  documentHistory: Partial<Record<DocumentName, string[]>>;
  tweakMessages: Partial<Record<DocumentName, TweakMessage[]>>;
  addTweakMessage: (name: DocumentName, message: TweakMessage) => void;
  generationStatus: GenerationStatus;
  setGenerationStatus: (status: GenerationStatus) => void;
  generationRunId: string | null;
  documentProgress: DocumentProgressState;
  beginGenerationRun: (runId: string) => void;
  setDocumentProgress: (
    name: DocumentName,
    status: DocumentProgressStatus,
    runId: string
  ) => void;
  markDownstreamStale: (name: DocumentName) => void;
  markDocumentFresh: (name: DocumentName) => void;
  currentGeneratingDoc: DocumentName | null;
  setCurrentGeneratingDoc: (name: DocumentName | null) => void;
  activeDocumentTab: DocumentName;
  setActiveDocumentTab: (name: DocumentName) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  resetAll: () => void;
}

const INITIAL_MUST_HAVES: MustHavesState = {
  projectVision: null,
  userRolesPermissions: null,
  keyFeatures: null,
  techStackCore: null,
  dataFlowIntegration: null,
  qaAndTesting: null,
  securityCompliance: null,
  teamPersonas: null,
};

const createDiscoveryEntry = (): DiscoveryEntry => ({
  draftValue: null,
  status: "empty",
  source: "user",
  missingDimensions: [],
  clarificationTurns: 0,
  needsReview: false,
});

export const createInitialDiscoveryState = (): DiscoveryState =>
  Object.fromEntries(
    MUST_HAVE_KEYS.map((key) => [key, createDiscoveryEntry()])
  ) as DiscoveryState;

export const createInitialDocumentProgress = (): DocumentProgressState =>
  Object.fromEntries(
    COP_GENERATION_ORDER.map((name) => [name, "pending"])
  ) as DocumentProgressState;

const DISCOVERY_DEPENDENTS: Partial<Record<MustHaveKey, MustHaveKey[]>> = {
  projectVision: ["userRolesPermissions", "keyFeatures"],
  userRolesPermissions: ["keyFeatures", "securityCompliance"],
  keyFeatures: [
    "techStackCore",
    "dataFlowIntegration",
    "qaAndTesting",
    "securityCompliance",
    "teamPersonas",
  ],
  techStackCore: [
    "dataFlowIntegration",
    "qaAndTesting",
    "securityCompliance",
    "teamPersonas",
  ],
  dataFlowIntegration: ["qaAndTesting", "securityCompliance"],
};

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

function findNextActiveVariable(discovery: DiscoveryState): MustHaveKey {
  return (
    MUST_HAVE_KEYS.find(
      (key) =>
        discovery[key].status !== "confirmed" || discovery[key].needsReview
    ) || "teamPersonas"
  );
}

export const useAppStore = create<AppStore>()((set, get) => ({
  phase: "onboarding",
  setPhase: (phase) => set({ phase }),
  mustHaves: { ...INITIAL_MUST_HAVES },
  discovery: createInitialDiscoveryState(),
  activeVariable: "projectVision",
  suggestedReplies: [],
  sessionLanguage: "id",
  languageLocked: false,
  onboardingConfirmed: false,

  updateMustHave: (key, value) => {
    set((state) => ({
      mustHaves: { ...state.mustHaves, [key]: value },
      discovery: {
        ...state.discovery,
        [key]: {
          ...state.discovery[key],
          draftValue: value,
          status: "confirmed",
          source: "user",
          missingDimensions: [],
          needsReview: false,
        },
      },
      onboardingConfirmed: false,
    }));
    get().checkOnboardingComplete();
  },

  applyOnboardingResponse: (response) => {
    set((state) => {
      const discovery = { ...state.discovery };
      const mustHaves = { ...state.mustHaves };
      const isOffTopic = response.turnOutcome === "off_topic";
      const provisionalUpdates = isOffTopic
        ? {}
        : response.provisionalUpdates;
      const confirmedUpdates = isOffTopic ? {} : response.confirmedUpdates;
      const hasContextUpdates =
        Object.keys(confirmedUpdates).length > 0 ||
        Object.keys(provisionalUpdates).length > 0;
      const confirmedKeys = new Set(
        Object.keys(confirmedUpdates) as MustHaveKey[]
      );

      for (const [rawKey, rawValue] of Object.entries(
        provisionalUpdates
      )) {
        const key = rawKey as MustHaveKey;
        if (!MUST_HAVE_KEYS.includes(key) || typeof rawValue !== "string") continue;
        discovery[key] = {
          ...discovery[key],
          draftValue: rawValue.trim(),
          status: discovery[key].status === "confirmed" ? "confirmed" : "draft",
          source: "user",
        };
      }

      for (const [rawKey, rawValue] of Object.entries(
        confirmedUpdates
      )) {
        const key = rawKey as MustHaveKey;
        if (!MUST_HAVE_KEYS.includes(key) || typeof rawValue !== "string") continue;
        const value = rawValue.trim();
        const changedExisting = Boolean(mustHaves[key]) && mustHaves[key] !== value;
        mustHaves[key] = value;
        discovery[key] = {
          ...discovery[key],
          draftValue: value,
          status: "confirmed",
          source: "user",
          missingDimensions: [],
          needsReview: false,
        };
        if (changedExisting) {
          for (const dependent of DISCOVERY_DEPENDENTS[key] || []) {
            if (confirmedKeys.has(dependent)) continue;
            discovery[dependent] = {
              ...discovery[dependent],
              needsReview: discovery[dependent].status === "confirmed",
            };
          }
        }
      }

      const activeVariable = response.activeVariable;
      const activeAlreadyConfirmed =
        discovery[activeVariable].status === "confirmed" &&
        !discovery[activeVariable].needsReview;
      if (!isOffTopic) {
        discovery[activeVariable] = {
          ...discovery[activeVariable],
          draftValue:
            response.draftValue ?? discovery[activeVariable].draftValue,
          status:
            activeAlreadyConfirmed
              ? "confirmed"
              : response.maturity === "needs_clarification"
                ? response.draftSource === "ai"
                  ? "recommended"
                  : "draft"
                : discovery[activeVariable].status,
          source: response.draftSource,
          missingDimensions: activeAlreadyConfirmed
            ? []
            : response.missingDimensions,
          clarificationTurns:
            !activeAlreadyConfirmed &&
            response.maturity === "needs_clarification"
              ? discovery[activeVariable].clarificationTurns + 1
              : discovery[activeVariable].clarificationTurns,
        };
      }

      return {
        mustHaves,
        discovery,
        activeVariable: findNextActiveVariable(discovery),
        suggestedReplies: response.suggestedReplies.slice(0, 3),
        sessionLanguage: response.sessionLanguage,
        languageLocked: true,
        onboardingConfirmed:
          state.onboardingConfirmed && !hasContextUpdates,
      };
    });
    get().checkOnboardingComplete();
  },

  reopenVariable: (key) => {
    set((state) => ({
      discovery: {
        ...state.discovery,
        [key]: { ...state.discovery[key], needsReview: true },
      },
      activeVariable: key,
      suggestedReplies: [],
      isOnboardingComplete: false,
      onboardingConfirmed: false,
    }));
  },

  setSessionLanguage: (sessionLanguage, locked = true) =>
    set({ sessionLanguage, languageLocked: locked }),

  confirmOnboarding: () => {
    get().checkOnboardingComplete();
    const complete = get().isOnboardingComplete;
    if (complete) set({ onboardingConfirmed: true, suggestedReplies: [] });
    return complete;
  },

  resetMustHaves: () =>
    set({
      mustHaves: { ...INITIAL_MUST_HAVES },
      discovery: createInitialDiscoveryState(),
      activeVariable: "projectVision",
      suggestedReplies: [],
      isOnboardingComplete: false,
      onboardingConfirmed: false,
    }),

  isOnboardingComplete: false,
  checkOnboardingComplete: () => {
    const { mustHaves, discovery } = get();
    const complete = MUST_HAVE_KEYS.every(
      (key) =>
        Boolean(mustHaves[key]?.trim()) &&
        discovery[key].status === "confirmed" &&
        !discovery[key].needsReview
    );
    set({ isOnboardingComplete: complete });
  },

  messages: [],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),

  documents: [],
  documentHistory: {},
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

  tweakMessages: {},
  addTweakMessage: (name, message) =>
    set((state) => ({
      tweakMessages: {
        ...state.tweakMessages,
        [name]: [...(state.tweakMessages[name] || []), message],
      },
    })),

  generationStatus: "idle",
  setGenerationStatus: (generationStatus) => set({ generationStatus }),
  generationRunId: null,
  documentProgress: createInitialDocumentProgress(),
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

  currentGeneratingDoc: null,
  setCurrentGeneratingDoc: (currentGeneratingDoc) =>
    set({ currentGeneratingDoc }),
  activeDocumentTab: "PRD",
  setActiveDocumentTab: (activeDocumentTab) => set({ activeDocumentTab }),
  _hasHydrated: true,
  setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),

  resetAll: () =>
    set({
      phase: "onboarding",
      mustHaves: { ...INITIAL_MUST_HAVES },
      discovery: createInitialDiscoveryState(),
      activeVariable: "projectVision",
      suggestedReplies: [],
      sessionLanguage: "id",
      languageLocked: false,
      onboardingConfirmed: false,
      isOnboardingComplete: false,
      messages: [],
      documents: [],
      documentHistory: {},
      tweakMessages: {},
      generationStatus: "idle",
      generationRunId: null,
      documentProgress: createInitialDocumentProgress(),
      currentGeneratingDoc: null,
      activeDocumentTab: "PRD",
      _hasHydrated: true,
    }),
}));
