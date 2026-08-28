import { describe, it, expect } from "vitest";
import {
  MUST_HAVE_KEYS,
  MUST_HAVE_LABELS,
  MUST_HAVE_DESCRIPTIONS,
  COP_GENERATION_ORDER,
  DOCUMENT_FILENAMES,
  DOCUMENT_LABELS,
  normalizeMustHaveKey,
} from "@/types/schema";

describe("Schema constants", () => {
  it("should have exactly 8 Must-Have keys", () => {
    expect(MUST_HAVE_KEYS).toHaveLength(8);
  });

  it("should have labels for all Must-Have keys", () => {
    for (const key of MUST_HAVE_KEYS) {
      expect(MUST_HAVE_LABELS[key]).toBeTruthy();
      expect(typeof MUST_HAVE_LABELS[key]).toBe("string");
    }
  });

  it("should have descriptions for all Must-Have keys", () => {
    for (const key of MUST_HAVE_KEYS) {
      expect(MUST_HAVE_DESCRIPTIONS[key]).toBeTruthy();
      expect(typeof MUST_HAVE_DESCRIPTIONS[key]).toBe("string");
    }
  });

  it("should have exactly 3 documents in CoP generation order", () => {
    expect(COP_GENERATION_ORDER).toHaveLength(3);
  });

  it("should start CoP with PRD and end with AGENTS", () => {
    expect(COP_GENERATION_ORDER[0]).toBe("PRD");
    expect(COP_GENERATION_ORDER[2]).toBe("AGENTS");
  });

  it("should have filenames for all documents", () => {
    for (const docName of COP_GENERATION_ORDER) {
      expect(DOCUMENT_FILENAMES[docName]).toBeTruthy();
      expect(DOCUMENT_FILENAMES[docName]).toContain(".md");
    }
  });

  it("should have labels for all documents", () => {
    for (const docName of COP_GENERATION_ORDER) {
      expect(DOCUMENT_LABELS[docName]).toBeTruthy();
    }
  });

  it("should have correct CoP order", () => {
    expect(COP_GENERATION_ORDER).toEqual([
      "PRD",
      "ARCHITECTURE",
      "AGENTS",
    ]);
  });
});

describe("normalizeMustHaveKey", () => {
  it("should return camelCase keys as-is", () => {
    for (const key of MUST_HAVE_KEYS) {
      expect(normalizeMustHaveKey(key)).toBe(key);
    }
  });

  it("should normalize snake_case keys correctly", () => {
    expect(normalizeMustHaveKey("project_vision")).toBe("projectVision");
    expect(normalizeMustHaveKey("user_roles_permissions")).toBe("userRolesPermissions");
    expect(normalizeMustHaveKey("key_features")).toBe("keyFeatures");
    expect(normalizeMustHaveKey("tech_stack_core")).toBe("techStackCore");
    expect(normalizeMustHaveKey("data_flow_integration")).toBe("dataFlowIntegration");
    expect(normalizeMustHaveKey("qa_and_testing")).toBe("qaAndTesting");
    expect(normalizeMustHaveKey("security_compliance")).toBe("securityCompliance");
    expect(normalizeMustHaveKey("team_personas")).toBe("teamPersonas");
  });

  it("should normalize common alias variants", () => {
    expect(normalizeMustHaveKey("vision")).toBe("projectVision");
    expect(normalizeMustHaveKey("tech_stack")).toBe("techStackCore");
    expect(normalizeMustHaveKey("techstack")).toBe("techStackCore");
    expect(normalizeMustHaveKey("qa")).toBe("qaAndTesting");
    expect(normalizeMustHaveKey("testing")).toBe("qaAndTesting");
    expect(normalizeMustHaveKey("security")).toBe("securityCompliance");
    expect(normalizeMustHaveKey("personas")).toBe("teamPersonas");
    expect(normalizeMustHaveKey("ai_agents")).toBe("teamPersonas");
  });

  it("should return null for invalid keys", () => {
    expect(normalizeMustHaveKey("random_key")).toBeNull();
    expect(normalizeMustHaveKey("")).toBeNull();
    expect(normalizeMustHaveKey(null as any)).toBeNull();
  });
});
