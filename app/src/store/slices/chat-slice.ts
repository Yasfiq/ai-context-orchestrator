import type { StateCreator } from "zustand";
import type { AppStore } from "@/store/app-store-types";
import type { ChatMessage, DocumentName } from "@/types/schema";
import { createInitialDiscoveryState } from "@/store/slices/onboarding-slice";
import { createInitialDocumentProgress } from "@/store/slices/documents-slice";

export interface TweakMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatSlice {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  tweakMessages: Partial<Record<DocumentName, TweakMessage[]>>;
  addTweakMessage: (name: DocumentName, message: TweakMessage) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  resetAll: () => void;
}

/**
 * Chat slice: onboarding chat transcript, per-document tweak threads,
 * hydration flag, and full-store reset.
 */
export const createChatSlice: StateCreator<
  AppStore,
  [],
  [],
  ChatSlice
> = (set) => ({
  messages: [],
  tweakMessages: {},
  _hasHydrated: true,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  addTweakMessage: (name, message) =>
    set((state) => ({
      tweakMessages: {
        ...state.tweakMessages,
        [name]: [...(state.tweakMessages[name] || []), message],
      },
    })),
  setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),

  resetAll: () =>
    set({
      phase: "onboarding",
      mustHaves: {
        projectVision: null,
        userRolesPermissions: null,
        keyFeatures: null,
        techStackCore: null,
        dataFlowIntegration: null,
        qaAndTesting: null,
        securityCompliance: null,
        teamPersonas: null,
      },
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
});
