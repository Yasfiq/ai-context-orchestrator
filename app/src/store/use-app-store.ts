import { create } from "zustand";
import type { AppStore } from "@/store/app-store-types";
import type { ChatSlice, TweakMessage } from "@/store/slices/chat-slice";
import type { DocumentsSlice } from "@/store/slices/documents-slice";
import {
  createChatSlice,
} from "@/store/slices/chat-slice";
import { createDocumentsSlice } from "@/store/slices/documents-slice";
import {
  createOnboardingSlice,
  type AppPhase,
  type OnboardingSlice,
} from "@/store/slices/onboarding-slice";

/**
 * Single Zustand store composed from domain slices.
 * Consumers keep importing `useAppStore` from this barrel — the store
 * instance, action semantics, and reset boundaries are unchanged.
 */
export const useAppStore = create<AppStore>()((...args) => ({
  ...createOnboardingSlice(...args),
  ...createDocumentsSlice(...args),
  ...createChatSlice(...args),
}));

export {
  createInitialDiscoveryState,
  createOnboardingSlice,
} from "@/store/slices/onboarding-slice";
export { createInitialDocumentProgress } from "@/store/slices/documents-slice";
export type { AppPhase, OnboardingSlice } from "@/store/slices/onboarding-slice";
export type { DocumentsSlice } from "@/store/slices/documents-slice";
export type { ChatSlice, TweakMessage } from "@/store/slices/chat-slice";
