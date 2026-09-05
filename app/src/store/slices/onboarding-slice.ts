import type { StateCreator } from "zustand";
import type { AppStore } from "@/store/app-store-types";
import type {
  ChatMessage,
  DiscoveryEntry,
  DiscoveryState,
  MustHaveKey,
  MustHavesState,
  OnboardingApiResponse,
  SessionLanguage,
  SuggestedReply,
} from "@/types/schema";
import { MUST_HAVE_KEYS } from "@/types/schema";

export type AppPhase = "onboarding" | "generating" | "results";

export interface OnboardingSlice {
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;
  mustHaves: MustHavesState;
  discovery: DiscoveryState;
  activeVariable: MustHaveKey;
  suggestedReplies: SuggestedReply[];
  sessionLanguage: SessionLanguage;
  languageLocked: boolean;
  onboardingConfirmed: boolean;
  isOnboardingComplete: boolean;
  updateMustHave: (key: MustHaveKey, value: string) => void;
  applyOnboardingResponse: (response: OnboardingApiResponse) => void;
  reopenVariable: (key: MustHaveKey) => void;
  setSessionLanguage: (language: SessionLanguage, locked?: boolean) => void;
  confirmOnboarding: () => boolean;
  resetMustHaves: () => void;
  checkOnboardingComplete: () => void;
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

function findNextActiveVariable(discovery: DiscoveryState): MustHaveKey {
  return (
    MUST_HAVE_KEYS.find(
      (key) =>
        discovery[key].status !== "confirmed" || discovery[key].needsReview
    ) || "teamPersonas"
  );
}

/**
 * Onboarding slice: 8 Must-Haves discovery flow, session language,
 * and the confirmed/complete checkpoints.
 */
export const createOnboardingSlice: StateCreator<
  AppStore,
  [],
  [],
  OnboardingSlice
> = (set, get) => ({
  phase: "onboarding",
  setPhase: (phase) => set({ phase }),
  mustHaves: { ...INITIAL_MUST_HAVES },
  discovery: createInitialDiscoveryState(),
  activeVariable: "projectVision",
  suggestedReplies: [],
  sessionLanguage: "id",
  languageLocked: false,
  onboardingConfirmed: false,
  isOnboardingComplete: false,

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
});
