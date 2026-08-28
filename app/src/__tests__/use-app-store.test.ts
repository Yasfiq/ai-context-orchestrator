import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/store/use-app-store";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.getState().resetAll();
  });

  it("should have correct initial state", () => {
    const state = useAppStore.getState();
    expect(state.phase).toBe("onboarding");
    expect(state.isOnboardingComplete).toBe(false);
    expect(state.messages).toHaveLength(0);
    expect(state.documents).toHaveLength(0);
    expect(state.generationStatus).toBe("idle");
    expect(state.activeDocumentTab).toBe("PRD");
  });

  it("should update a single must-have variable", () => {
    useAppStore.getState().updateMustHave("projectVision", "Build a todo app");
    const state = useAppStore.getState();
    expect(state.mustHaves.projectVision).toBe("Build a todo app");
  });

  it("should not mark onboarding complete with only 1 variable filled", () => {
    useAppStore.getState().updateMustHave("projectVision", "Todo app");
    expect(useAppStore.getState().isOnboardingComplete).toBe(false);
  });

  it("should mark onboarding complete when all 8 variables are filled", () => {
    const store = useAppStore.getState();
    store.updateMustHave("projectVision", "Todo app");
    store.updateMustHave("userRolesPermissions", "Admin, User");
    store.updateMustHave("keyFeatures", "CRUD, Auth, Dashboard");
    store.updateMustHave("techStackCore", "Next.js, Tailwind");
    store.updateMustHave("dataFlowIntegration", "REST API, PostgreSQL");
    store.updateMustHave("qaAndTesting", "Vitest, Playwright");
    store.updateMustHave("securityCompliance", "JWT Auth, HTTPS");
    store.updateMustHave("teamPersonas", "Frontend Dev, Backend Dev");

    expect(useAppStore.getState().isOnboardingComplete).toBe(true);
  });

  it("should add messages correctly", () => {
    useAppStore.getState().addMessage({
      id: "test-1",
      role: "user",
      content: "Hello",
      timestamp: Date.now(),
    });

    expect(useAppStore.getState().messages).toHaveLength(1);
    expect(useAppStore.getState().messages[0].content).toBe("Hello");
  });

  it("should clear messages", () => {
    useAppStore.getState().addMessage({
      id: "test-1",
      role: "user",
      content: "Hello",
      timestamp: Date.now(),
    });
    useAppStore.getState().clearMessages();

    expect(useAppStore.getState().messages).toHaveLength(0);
  });

  it("should set phase correctly", () => {
    useAppStore.getState().setPhase("generating");
    expect(useAppStore.getState().phase).toBe("generating");
  });

  it("should update document content", () => {
    useAppStore.getState().setDocuments([
      {
        name: "PRD",
        filename: "PRD.md",
        content: "Original content",
        generatedAt: Date.now(),
      },
    ]);

    useAppStore.getState().updateDocument("PRD", "Updated content");
    const doc = useAppStore.getState().documents.find((d) => d.name === "PRD");
    expect(doc?.content).toBe("Updated content");
  });

  it("should reset all state", () => {
    useAppStore.getState().updateMustHave("projectVision", "Test");
    useAppStore.getState().setPhase("results");
    useAppStore.getState().addMessage({
      id: "test",
      role: "user",
      content: "Hello",
      timestamp: Date.now(),
    });

    useAppStore.getState().resetAll();
    const state = useAppStore.getState();

    expect(state.phase).toBe("onboarding");
    expect(state.mustHaves.projectVision).toBeNull();
    expect(state.messages).toHaveLength(0);
    expect(state.isOnboardingComplete).toBe(false);
  });

  it("should set active document tab", () => {
    useAppStore.getState().setActiveDocumentTab("ARCHITECTURE");
    expect(useAppStore.getState().activeDocumentTab).toBe("ARCHITECTURE");
  });

  it("should support undoing document revisions", () => {
    useAppStore.getState().setDocuments([
      {
        name: "PRD",
        filename: "PRD.md",
        content: "Version 1",
        generatedAt: Date.now(),
      },
    ]);

    expect(useAppStore.getState().canUndoDocument("PRD")).toBe(false);

    useAppStore.getState().updateDocument("PRD", "Version 2");
    expect(useAppStore.getState().canUndoDocument("PRD")).toBe(true);
    expect(useAppStore.getState().documents[0].content).toBe("Version 2");

    const undone = useAppStore.getState().undoDocument("PRD");
    expect(undone).toBe(true);
    expect(useAppStore.getState().documents[0].content).toBe("Version 1");
    expect(useAppStore.getState().canUndoDocument("PRD")).toBe(false);
  });

  it("should persist and manage tweak messages per document", () => {
    useAppStore.getState().addTweakMessage("PRD", {
      id: "tweak-1",
      role: "user",
      content: "Make it more concise",
    });

    const messages = useAppStore.getState().tweakMessages["PRD"];
    expect(messages).toHaveLength(1);
    expect(messages?.[0].content).toBe("Make it more concise");
  });

  it("keeps provisional onboarding evidence out of confirmed progress", () => {
    useAppStore.getState().applyOnboardingResponse({
      reply: "Perlu klarifikasi.",
      activeVariable: "projectVision",
      maturity: "needs_clarification",
      draftValue: "Aplikasi todo list",
      draftSource: "user",
      missingDimensions: ["target context"],
      confirmedUpdates: {},
      provisionalUpdates: { projectVision: "Aplikasi todo list" },
      suggestedReplies: [],
      sessionLanguage: "id",
    });

    const state = useAppStore.getState();
    expect(state.mustHaves.projectVision).toBeNull();
    expect(state.discovery.projectVision.status).toBe("draft");
    expect(state.isOnboardingComplete).toBe(false);
  });

  it("does not mutate discovery state or clarification count for off-topic turns", () => {
    const store = useAppStore.getState();
    store.applyOnboardingResponse({
      reply: "Konfirmasi rekomendasi.",
      activeVariable: "techStackCore",
      maturity: "needs_clarification",
      draftValue: "Framework recommendation: Next.js (awaiting confirmation)",
      draftSource: "ai",
      missingDimensions: ["explicit framework confirmation"],
      confirmedUpdates: {},
      provisionalUpdates: {},
      suggestedReplies: [],
      sessionLanguage: "id",
      turnOutcome: "ambiguous",
    });
    const before = useAppStore.getState().discovery.techStackCore;

    store.applyOnboardingResponse({
      reply: "Kembali ke pilihan framework.",
      activeVariable: "techStackCore",
      maturity: "ready",
      draftValue: "Next.js",
      draftSource: "user",
      missingDimensions: [],
      confirmedUpdates: { techStackCore: "Next.js" },
      provisionalUpdates: { dataFlowIntegration: "Makan mie" },
      suggestedReplies: [],
      sessionLanguage: "id",
      turnOutcome: "off_topic",
    });

    const state = useAppStore.getState();
    expect(state.discovery.techStackCore).toEqual(before);
    expect(state.mustHaves.techStackCore).toBeNull();
    expect(state.discovery.dataFlowIntegration.draftValue).toBeNull();
  });

  it("requires the final confirmation checkpoint", () => {
    const store = useAppStore.getState();
    store.updateMustHave("projectVision", "Vision");
    store.updateMustHave("userRolesPermissions", "Roles");
    store.updateMustHave("keyFeatures", "Features");
    store.updateMustHave("techStackCore", "Stack");
    store.updateMustHave("dataFlowIntegration", "Flow");
    store.updateMustHave("qaAndTesting", "QA");
    store.updateMustHave("securityCompliance", "Security");
    store.updateMustHave("teamPersonas", "Agents");

    expect(useAppStore.getState().isOnboardingComplete).toBe(true);
    expect(useAppStore.getState().onboardingConfirmed).toBe(false);
    expect(useAppStore.getState().confirmOnboarding()).toBe(true);
    expect(useAppStore.getState().onboardingConfirmed).toBe(true);
  });

  it("ignores stale generation updates from an older run", () => {
    const store = useAppStore.getState();
    store.beginGenerationRun("run-1");
    store.setDocumentProgress("PRD", "generating", "run-1");
    store.beginGenerationRun("run-2");
    store.setDocumentProgress("PRD", "completed", "run-1");

    expect(useAppStore.getState().documentProgress.PRD).toBe("pending");
  });

  it("does not move a completed document backwards to generating", () => {
    const store = useAppStore.getState();
    store.beginGenerationRun("run-1");
    store.setDocumentProgress("PRD", "generating", "run-1");
    store.setDocumentProgress("PRD", "completed", "run-1");
    store.setDocumentProgress("PRD", "generating", "run-1");

    expect(useAppStore.getState().documentProgress.PRD).toBe("completed");
  });

  it("marks dependent documents stale after a source document changes", () => {
    const store = useAppStore.getState();
    store.setDocuments([
      {
        name: "PRD",
        filename: "PRD.md",
        content: "Old PRD",
        generatedAt: Date.now(),
      },
      {
        name: "ARCHITECTURE",
        filename: "ARCHITECTURE.md",
        content: "Architecture",
        generatedAt: Date.now(),
      },
      {
        name: "AGENTS",
        filename: "AGENTS.md",
        content: "Plan",
        generatedAt: Date.now(),
      },
    ]);
    store.beginGenerationRun("run-1");
    store.updateDocument("PRD", "New PRD");

    expect(useAppStore.getState().documentProgress.ARCHITECTURE).toBe("stale");
    expect(useAppStore.getState().documentProgress.AGENTS).toBe(
      "stale"
    );
  });
});
