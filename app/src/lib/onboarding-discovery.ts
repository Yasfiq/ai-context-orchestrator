import type {
  DiscoveryState,
  MustHaveKey,
  MustHavesState,
  OnboardingApiResponse,
  SessionLanguage,
} from "@/types/schema";
import { MUST_HAVE_KEYS } from "@/types/schema";
import { MATURITY_RUBRICS } from "./onboarding-rubrics";

export { MATURITY_RUBRICS } from "./onboarding-rubrics";
export { resolveSessionLanguage } from "./onboarding-language";
export {
  getDefaultSuggestions,
  parseOnboardingResponse,
} from "./onboarding-parser";
export { createTechStackGuidance } from "./onboarding-tech-stack";

export function normalizeDiscoveryState(
  value: unknown,
  mustHaves: MustHavesState
): DiscoveryState {
  const raw =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return Object.fromEntries(
    MUST_HAVE_KEYS.map((key) => {
      const entry =
        raw[key] && typeof raw[key] === "object"
          ? (raw[key] as Record<string, unknown>)
          : {};
      const confirmed = Boolean(mustHaves[key]?.trim());
      return [
        key,
        {
          draftValue:
            typeof entry.draftValue === "string"
              ? entry.draftValue.slice(0, 10_000)
              : mustHaves[key],
          status: confirmed
            ? "confirmed"
            : ["empty", "draft", "recommended"].includes(String(entry.status))
              ? entry.status
              : "empty",
          source: ["user", "ai", "mixed"].includes(String(entry.source))
            ? entry.source
            : "user",
          missingDimensions: Array.isArray(entry.missingDimensions)
            ? entry.missingDimensions
                .filter((item): item is string => typeof item === "string")
                .slice(0, 6)
            : [],
          clarificationTurns:
            typeof entry.clarificationTurns === "number"
              ? Math.min(Math.max(entry.clarificationTurns, 0), 5)
              : 0,
          needsReview: entry.needsReview === true,
        },
      ];
    })
  ) as DiscoveryState;
}

export function getActiveDiscoveryVariable(
  mustHaves: MustHavesState,
  discovery: DiscoveryState
): MustHaveKey {
  return (
    MUST_HAVE_KEYS.find(
      (key) =>
        !mustHaves[key]?.trim() ||
        discovery[key].status !== "confirmed" ||
        discovery[key].needsReview
    ) || "teamPersonas"
  );
}

export function createOnboardingFallback(
  activeVariable: MustHaveKey,
  language: SessionLanguage
): OnboardingApiResponse {
  const missingDimensions = MATURITY_RUBRICS[activeVariable];
  const isId = language === "id";
  return {
    reply: isId
      ? `Saya belum bisa memastikan bagian ini dengan aman. Mari fokus pada satu hal dulu: ${missingDimensions[0]}. Bisa Anda jelaskan bagian tersebut?`
      : `I cannot confirm this safely yet. Let us focus on one thing first: ${missingDimensions[0]}. Could you clarify that part?`,
    activeVariable,
    maturity: "needs_clarification",
    draftValue: null,
    draftSource: "user",
    missingDimensions,
    confirmedUpdates: {},
    provisionalUpdates: {},
    suggestedReplies: [],
    sessionLanguage: language,
    turnOutcome: "ambiguous",
  };
}
