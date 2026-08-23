import { describe, it, expect } from "vitest";
import { buildCopPrompt } from "@/prompts/cop-pipeline";
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

  describe("RULES prompt", () => {
    it("should reference PRD and ARCHITECTURE", () => {
      const previousDocs = {
        PRD: "# PRD",
        ARCHITECTURE: "# Arch",
      };
      const prompt = buildCopPrompt("RULES", FILLED_MUST_HAVES, previousDocs);
      expect(prompt).toContain("REFERENCE: PRD");
      expect(prompt).toContain("REFERENCE: ARCHITECTURE");
    });

    it("should include rules-specific sections", () => {
      const prompt = buildCopPrompt("RULES", FILLED_MUST_HAVES);
      expect(prompt).toContain("Scope Boundaries");
      expect(prompt).toContain("Naming Conventions");
      expect(prompt).toContain("Error Handling");
      expect(prompt).toContain("MUST");
    });
  });

  describe("WORKFLOW prompt", () => {
    it("should reference PRD, ARCHITECTURE, and RULES", () => {
      const previousDocs = {
        PRD: "# PRD",
        ARCHITECTURE: "# Arch",
        RULES: "# Rules",
      };
      const prompt = buildCopPrompt("WORKFLOW", FILLED_MUST_HAVES, previousDocs);
      expect(prompt).toContain("REFERENCE: PRD");
      expect(prompt).toContain("REFERENCE: ARCHITECTURE");
      expect(prompt).toContain("REFERENCE: RULES");
    });

    it("should include workflow-specific sections", () => {
      const prompt = buildCopPrompt("WORKFLOW", FILLED_MUST_HAVES);
      expect(prompt).toContain("Git Branching");
      expect(prompt).toContain("Code Review");
      expect(prompt).toContain("CI/CD");
      expect(prompt).toContain("Release Process");
    });
  });

  describe("SKILLS_MATRIX prompt", () => {
    it("should reference AGENTS and ARCHITECTURE", () => {
      const previousDocs = {
        AGENTS: "# Agents",
        ARCHITECTURE: "# Arch",
      };
      const prompt = buildCopPrompt("SKILLS_MATRIX", FILLED_MUST_HAVES, previousDocs);
      expect(prompt).toContain("REFERENCE: AGENTS");
      expect(prompt).toContain("REFERENCE: ARCHITECTURE");
    });

    it("should include skills matrix-specific sections", () => {
      const prompt = buildCopPrompt("SKILLS_MATRIX", FILLED_MUST_HAVES);
      expect(prompt).toContain("Task-to-Agent Mapping");
      expect(prompt).toContain("Collaboration Patterns");
      expect(prompt).toContain("Prompt Templates");
    });
  });

  describe("IMPLEMENTATION_PLAN prompt", () => {
    it("should reference PRD, ARCHITECTURE, and AGENTS", () => {
      const previousDocs = {
        PRD: "# PRD",
        ARCHITECTURE: "# Arch",
        AGENTS: "# Agents",
      };
      const prompt = buildCopPrompt("IMPLEMENTATION_PLAN", FILLED_MUST_HAVES, previousDocs);
      expect(prompt).toContain("REFERENCE: PRD");
      expect(prompt).toContain("REFERENCE: ARCHITECTURE");
      expect(prompt).toContain("REFERENCE: AGENTS");
    });

    it("should include implementation plan-specific sections", () => {
      const prompt = buildCopPrompt("IMPLEMENTATION_PLAN", FILLED_MUST_HAVES);
      expect(prompt).toContain("Phase Name");
      expect(prompt).toContain("Prerequisites");
      expect(prompt).toContain("Completion Criteria");
      expect(prompt).toContain("micro-prompt");
    });
  });

  describe("Context chaining — full pipeline simulation", () => {
    it("should build all 7 prompts without error", () => {
      const previousDocs: Record<string, string> = {};
      for (const docName of COP_GENERATION_ORDER) {
        const prompt = buildCopPrompt(docName, FILLED_MUST_HAVES, previousDocs);
        expect(prompt.length).toBeGreaterThan(100);
        previousDocs[docName] = `# Generated ${docName} content`;
      }
    });

    it("should accumulate context through the chain", () => {
      const previousDocs: Record<string, string> = {};
      previousDocs["PRD"] = "# PRD: Task Management App";
      previousDocs["ARCHITECTURE"] = "# Architecture: Next.js + Supabase";
      previousDocs["AGENTS"] = "# Agents: @frontend, @backend";
      previousDocs["RULES"] = "# Rules: TypeScript strict mode";

      const workflowPrompt = buildCopPrompt("WORKFLOW", FILLED_MUST_HAVES, previousDocs);
      expect(workflowPrompt).toContain("Task Management App");
      expect(workflowPrompt).toContain("Next.js + Supabase");
      expect(workflowPrompt).toContain("TypeScript strict mode");
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
});
