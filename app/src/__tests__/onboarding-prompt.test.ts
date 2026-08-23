import { describe, expect, it } from "vitest";
import {
  buildOnboardingSystemPrompt,
  getNextEmptyVariable,
} from "@/prompts/onboarding-prompt";
import type { MustHavesState } from "@/types/schema";

const EMPTY_STATE: MustHavesState = {
  projectVision: null,
  userRolesPermissions: null,
  keyFeatures: null,
  techStackCore: null,
  dataFlowIntegration: null,
  qaAndTesting: null,
  securityCompliance: null,
  teamPersonas: null,
};

const PARTIAL_STATE: MustHavesState = {
  ...EMPTY_STATE,
  projectVision: "Task manager for a small operations team",
  userRolesPermissions: "Members manage tasks; leads manage workflow",
};

const FULL_STATE: MustHavesState = {
  projectVision: "Task manager for a small operations team",
  userRolesPermissions: "Members and team leads",
  keyFeatures: "Task capture, prioritization, Kanban, reporting",
  techStackCore: "Next.js, Tailwind CSS, Zustand",
  dataFlowIntegration: "REST API and PostgreSQL",
  qaAndTesting: "Vitest and Playwright",
  securityCompliance: "Secure sessions and RBAC",
  teamPersonas: "Frontend, backend, QA, architect",
};

describe("buildOnboardingSystemPrompt", () => {
  it("defines deterministic Project Vision maturity requirements", () => {
    const prompt = buildOnboardingSystemPrompt(EMPTY_STATE);
    expect(prompt).toContain("target user or usage context");
    expect(prompt).toContain("primary problem");
    expect(prompt).toContain("desired outcome");
    expect(prompt).toContain('"todo list"');
  });

  it("enforces one primary decision and progressive disclosure", () => {
    const prompt = buildOnboardingSystemPrompt(EMPTY_STATE);
    expect(prompt).toContain("exactly ONE primary decision");
    expect(prompt).toContain("progressive disclosure");
    expect(prompt).toContain("Never ask the user to choose framework, styling");
  });

  it("requires recommendations to remain provisional", () => {
    const prompt = buildOnboardingSystemPrompt(EMPTY_STATE);
    expect(prompt).toContain("AI recommendations remain provisional");
    expect(prompt).toContain("explicitly confirmed");
  });

  it("supports opportunistic capture without changing visible focus", () => {
    const prompt = buildOnboardingSystemPrompt(EMPTY_STATE);
    expect(prompt).toContain("provisionalUpdates");
    expect(prompt).toContain("visible question focused");
  });

  it("defines the strict structured response contract", () => {
    const prompt = buildOnboardingSystemPrompt(EMPTY_STATE);
    expect(prompt).toContain('"confirmedUpdates"');
    expect(prompt).toContain('"missingDimensions"');
    expect(prompt).toContain('"suggestedReplies"');
    expect(prompt).toContain('"turnOutcome"');
    expect(prompt).toContain("Return ONLY one valid JSON object");
  });

  it("scopes recommendation provenance to the current turn", () => {
    const prompt = buildOnboardingSystemPrompt(
      EMPTY_STATE,
      "id",
      undefined,
      "projectVision",
      "suggestion",
      true
    );

    expect(prompt).toContain("Input method: suggestion");
    expect(prompt).toContain(
      "This provenance applies ONLY to the latest user message"
    );
    expect(prompt).toContain("not proof of confirmation");
  });

  it("locks visible language while allowing technical terms", () => {
    const prompt = buildOnboardingSystemPrompt(EMPTY_STATE, "id");
    expect(prompt).toContain("Bahasa Indonesia");
    expect(prompt).toContain("mixed technical terms");
    expect(prompt).toContain("explicitly asks");
  });

  it("focuses on the next incomplete variable", () => {
    const prompt = buildOnboardingSystemPrompt(PARTIAL_STATE);
    expect(prompt).toContain("keyFeatures: Key Features");
  });

  it("offers synthesis after repeated clarification", () => {
    const prompt = buildOnboardingSystemPrompt(EMPTY_STATE);
    expect(prompt).toContain("After two clarification turns");
    expect(prompt).toContain("recommended answer");
  });

  it("includes final review instructions after all variables are collected", () => {
    const prompt = buildOnboardingSystemPrompt(FULL_STATE);
    expect(prompt).toContain("ALL VARIABLES COLLECTED");
    expect(prompt).toContain("review and confirm");
    expect(prompt).toContain("Generate Documents");
  });

  it("forbids reasoning leakage", () => {
    const prompt = buildOnboardingSystemPrompt(EMPTY_STATE);
    expect(prompt).toContain("Never expose reasoning");
    expect(prompt).toContain("Chain of Thought");
  });
});

describe("getNextEmptyVariable", () => {
  it("returns projectVision when all values are empty", () => {
    expect(getNextEmptyVariable(EMPTY_STATE)).toBe("projectVision");
  });

  it("returns keyFeatures after vision and roles are filled", () => {
    expect(getNextEmptyVariable(PARTIAL_STATE)).toBe("keyFeatures");
  });

  it("returns null when all values are filled", () => {
    expect(getNextEmptyVariable(FULL_STATE)).toBeNull();
  });

  it("treats whitespace as unfilled", () => {
    expect(
      getNextEmptyVariable({ ...FULL_STATE, qaAndTesting: "   " })
    ).toBe("qaAndTesting");
  });
});
