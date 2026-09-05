import type { ChatSlice } from "@/store/slices/chat-slice";
import type { DocumentsSlice } from "@/store/slices/documents-slice";
import type { OnboardingSlice } from "@/store/slices/onboarding-slice";

/**
 * Composed store type. Slices type their `StateCreator` against this full
 * type so actions can read/write state owned by sibling slices (e.g.
 * `resetAll` in the chat slice resets every domain).
 */
export type AppStore = OnboardingSlice & DocumentsSlice & ChatSlice;
