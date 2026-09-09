import { describe, it, expect } from "vitest";
import { buildCopPrompt, condenseReferenceContent } from "@/prompts/cop-pipeline";
import type { MustHavesState, DocumentName } from "@/types/schema";
import { COP_GENERATION_ORDER } from "@/types/schema";

const FILLED_MUST_HAVES: MustHavesState = {
  projectVision: "A task management app to help remote teams collaborate",
  userRolesPermissions: "Admin, Team Lead, Member, Guest",
  keyFeatures: "Task CRUD, Kanban board, Real-time notifications, Team chat",
  techStackCore: "Next.js 14, Tailwind CSS, Zustand, PostgreSQL",
  dataFlowIntegration: "REST API, Supabase, WebSocket for real-time",
  qaAndTesting: "Vitest for unit tests, Playwright for E2E",
  securityCompliance: "JWT authentication, Row-level security, HTTPS",
  teamPersonas: "Frontend Engineer, Backend Engineer, DevOps Specialist",
};

const EMPTY_MUST_HAVES: MustHavesState = {
  projectVision: null,
  userRolesPermissions: null,
  keyFeatures: null,
  techStackCore: null,
  dataFlowIntegration: null,
  qaAndTesting: null,
  securityCompliance: null,
  teamPersonas: null,
};

describe("buildCopPrompt", () => {
  describe("PRD prompt", () => {
    it("should include project context from Must-Haves", () => {
      const prompt = buildCopPrompt("PRD", FILLED_MUST_HAVES);
      expect(prompt).toContain("task management app");
      expect(prompt).toContain("Admin, Team Lead");
      expect(prompt).toContain("Next.js 14");
    });

    it("should include PRD-specific section requirements", () => {
      const prompt = buildCopPrompt("PRD", FILLED_MUST_HAVES);
      expect(prompt).toContain("Product Vision");
      expect(prompt).toContain("Core Features");
      expect(prompt).toContain("Target Users");
      expect(prompt).toContain("Success Metrics");
      expect(prompt).toContain("Out of Scope");
    });

    it("should include security output rules", () => {
      const prompt = buildCopPrompt("PRD", FILLED_MUST_HAVES);
      expect(prompt).toContain("NEVER");
      expect(prompt).toContain("API keys");
    });

    it("should NOT reference previous documents for PRD (first in chain)", () => {
      const prompt = buildCopPrompt("PRD", FILLED_MUST_HAVES);
      expect(prompt).not.toContain("REFERENCE: PRD");
      expect(prompt).not.toContain("REFERENCE: ARCHITECTURE");
    });

    it("should handle null Must-Haves gracefully", () => {
      const prompt = buildCopPrompt("PRD", EMPTY_MUST_HAVES);
      expect(prompt).toContain("Not specified");
    });
  });

  describe("ARCHITECTURE prompt", () => {
    it("should include PRD as reference when provided", () => {
      const previousDocs = { PRD: "# PRD Content\nThis is a task management app." };
      const prompt = buildCopPrompt("ARCHITECTURE", FILLED_MUST_HAVES, previousDocs);
      expect(prompt).toContain("REFERENCE: PRD");
      expect(prompt).toContain("task management app");
    });

    it("should include architecture-specific sections", () => {
      const prompt = buildCopPrompt("ARCHITECTURE", FILLED_MUST_HAVES);
      expect(prompt).toContain("Technology Stack");
      expect(prompt).toContain("Directory");
      expect(prompt).toContain("Data Flow");
      expect(prompt).toContain("Security Architecture");
    });

    it("should work without previous documents", () => {
      const prompt = buildCopPrompt("ARCHITECTURE", FILLED_MUST_HAVES);
      expect(prompt).not.toContain("REFERENCE: PRD");
      expect(prompt).toContain("Technology Stack");
    });
  });

  describe("AGENTS prompt", () => {
    it("should include both PRD and ARCHITECTURE as references", () => {
      const previousDocs = {
        PRD: "# PRD Content",
        ARCHITECTURE: "# Architecture Content",
      };
      const prompt = buildCopPrompt("AGENTS", FILLED_MUST_HAVES, previousDocs);
      expect(prompt).toContain("REFERENCE: PRD");
      expect(prompt).toContain("REFERENCE: ARCHITECTURE");
    });

    it("should include agent-specific sections", () => {
      const prompt = buildCopPrompt("AGENTS", FILLED_MUST_HAVES);
      expect(prompt).toContain("Agent Tag");
      expect(prompt).toContain("Responsibilities");
      expect(prompt).toContain("Strict Rules");
      expect(prompt).toContain("Response Format");
    });
  });


  describe("Error handling", () => {
    it("should throw for unknown document type", () => {
      expect(() =>
        buildCopPrompt("UNKNOWN" as DocumentName, FILLED_MUST_HAVES)
      ).toThrow("Unknown document type");
    });
  });

  describe("Output rules — applied to all prompts", () => {
    it("should include Markdown format instruction in every prompt", () => {
      for (const docName of COP_GENERATION_ORDER) {
        const prompt = buildCopPrompt(docName, FILLED_MUST_HAVES);
        expect(prompt).toContain("Markdown");
      }
    });

    it("should include security warning in every prompt", () => {
      for (const docName of COP_GENERATION_ORDER) {
        const prompt = buildCopPrompt(docName, FILLED_MUST_HAVES);
        expect(prompt).toContain("API keys");
        expect(prompt).toContain("NEVER");
      }
    });
  });

  describe("condenseReferenceContent", () => {
    it("compacts excessive line breaks and limits character length", () => {
      const raw = "Paragraph 1\n\n\n\nParagraph 2\n\n\n\nParagraph 3";
      const result = condenseReferenceContent(raw, 100);
      expect(result).toBe("Paragraph 1\n\nParagraph 2\n\nParagraph 3");
    });

    it("handles empty content gracefully", () => {
      expect(condenseReferenceContent("")).toBe("");
    });
  });
});
