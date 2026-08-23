/**
 * Core type definitions for the 8 Must-Haves State variables
 * and related data structures used across the application.
 */

export type SessionLanguage = "id" | "en";

export type DiscoveryStatus =
  | "empty"
  | "draft"
  | "recommended"
  | "confirmed";

export type DiscoverySource = "user" | "ai" | "mixed";
export type OnboardingInputSource = "manual" | "suggestion";
export type OnboardingTurnOutcome = "accepted" | "ambiguous" | "off_topic";

export interface DiscoveryEntry {
  draftValue: string | null;
  status: DiscoveryStatus;
  source: DiscoverySource;
  missingDimensions: string[];
  clarificationTurns: number;
  needsReview: boolean;
}

/** The 8 Must-Haves State variables extracted during onboarding */
export interface MustHavesState {
  projectVision: string | null;
  userRolesPermissions: string | null;
  keyFeatures: string | null;
  techStackCore: string | null;
  dataFlowIntegration: string | null;
  qaAndTesting: string | null;
  securityCompliance: string | null;
  teamPersonas: string | null;
}

/** Keys of the 8 Must-Haves variables */
export type MustHaveKey = keyof MustHavesState;

export type DiscoveryState = Record<MustHaveKey, DiscoveryEntry>;

export interface SuggestedReply {
  label: string;
  value: string;
  recommended?: boolean;
}

export interface OnboardingApiResponse {
  reply: string;
  activeVariable: MustHaveKey;
  maturity: "draft" | "needs_clarification" | "ready";
  draftValue: string | null;
  draftSource: DiscoverySource;
  missingDimensions: string[];
  confirmedUpdates: Partial<MustHavesState>;
  provisionalUpdates: Partial<MustHavesState>;
  suggestedReplies: SuggestedReply[];
  sessionLanguage: SessionLanguage;
  turnOutcome?: OnboardingTurnOutcome;
}

/** Human-readable labels for each Must-Have variable */
export const MUST_HAVE_LABELS: Record<MustHaveKey, string> = {
  projectVision: "Project Vision",
  userRolesPermissions: "User Roles & Permissions",
  keyFeatures: "Key Features (MVP)",
  techStackCore: "Tech Stack Core",
  dataFlowIntegration: "Data Flow & Integration",
  qaAndTesting: "QA & Testing",
  securityCompliance: "Security & Compliance",
  teamPersonas: "Team Personas / AI Agents",
};

/** Descriptions for guiding the AI on what to extract */
export const MUST_HAVE_DESCRIPTIONS: Record<MustHaveKey, string> = {
  projectVision: "Tujuan utama proyek dan masalah yang diselesaikan",
  userRolesPermissions: "Aktor/pengguna yang terlibat dalam aplikasi",
  keyFeatures: "3-5 fitur inti dalam scope MVP",
  techStackCore: "Framework utama, styling, dan state management",
  dataFlowIntegration: "API eksternal, REST/GraphQL, jenis database",
  qaAndTesting: "Standar pengujian (unit test, E2E, dll)",
  securityCompliance: "Metode autentikasi dan kebijakan privasi data",
  teamPersonas: "Agen AI spesifik yang perlu dibuat di AGENTS.md",
};

/** All Must-Have keys in onboarding order */
export const MUST_HAVE_KEYS: MustHaveKey[] = [
  "projectVision",
  "userRolesPermissions",
  "keyFeatures",
  "techStackCore",
  "dataFlowIntegration",
  "qaAndTesting",
  "securityCompliance",
  "teamPersonas",
];

/** Dictionary of snake_case, lowercase, and common aliases for MustHave keys */
export const MUST_HAVE_KEY_ALIASES: Record<string, MustHaveKey> = {
  projectvision: "projectVision",
  project_vision: "projectVision",
  vision: "projectVision",
  userrolespermissions: "userRolesPermissions",
  user_roles_permissions: "userRolesPermissions",
  user_roles: "userRolesPermissions",
  roles: "userRolesPermissions",
  keyfeatures: "keyFeatures",
  key_features: "keyFeatures",
  features: "keyFeatures",
  techstackcore: "techStackCore",
  tech_stack_core: "techStackCore",
  tech_stack: "techStackCore",
  techstack: "techStackCore",
  dataflowintegration: "dataFlowIntegration",
  data_flow_integration: "dataFlowIntegration",
  data_flow: "dataFlowIntegration",
  dataflow: "dataFlowIntegration",
  qaandtesting: "qaAndTesting",
  qa_and_testing: "qaAndTesting",
  qa_testing: "qaAndTesting",
  qa: "qaAndTesting",
  testing: "qaAndTesting",
  securitycompliance: "securityCompliance",
  security_compliance: "securityCompliance",
  security: "securityCompliance",
  compliance: "securityCompliance",
  teampersonas: "teamPersonas",
  team_personas: "teamPersonas",
  personas: "teamPersonas",
  ai_agents: "teamPersonas",
  agents: "teamPersonas",
};

/** Normalizes any string to a canonical MustHaveKey or null if unrecognized */
export function normalizeMustHaveKey(rawKey: string): MustHaveKey | null {
  if (!rawKey || typeof rawKey !== "string") return null;
  const cleaned = rawKey.trim();
  if (MUST_HAVE_KEYS.includes(cleaned as MustHaveKey)) {
    return cleaned as MustHaveKey;
  }
  const lookup = cleaned.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (MUST_HAVE_KEY_ALIASES[lookup]) {
    return MUST_HAVE_KEY_ALIASES[lookup];
  }
  const lookupNoUnderscore = lookup.replace(/_/g, "");
  if (MUST_HAVE_KEY_ALIASES[lookupNoUnderscore]) {
    return MUST_HAVE_KEY_ALIASES[lookupNoUnderscore];
  }
  return null;
}

/** Chat message role */
export type MessageRole = "user" | "assistant" | "system";

/** A single chat message */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

/** Names of the 7 generated documents */
export type DocumentName =
  | "PRD"
  | "ARCHITECTURE"
  | "AGENTS"
  | "RULES"
  | "WORKFLOW"
  | "SKILLS_MATRIX"
  | "IMPLEMENTATION_PLAN";

/** Document filename mapping */
export const DOCUMENT_FILENAMES: Record<DocumentName, string> = {
  PRD: "PRD.md",
  ARCHITECTURE: "ARCHITECTURE.md",
  AGENTS: "AGENTS.md",
  RULES: "RULES.md",
  WORKFLOW: "WORKFLOW.md",
  SKILLS_MATRIX: "SKILLS_MATRIX.md",
  IMPLEMENTATION_PLAN: "IMPLEMENTATION_PLAN.md",
};

/** Human-readable labels for documents */
export const DOCUMENT_LABELS: Record<DocumentName, string> = {
  PRD: "Product Requirements Document",
  ARCHITECTURE: "Architecture",
  AGENTS: "AI Agents",
  RULES: "Rules & Conventions",
  WORKFLOW: "Workflow",
  SKILLS_MATRIX: "Skills Matrix",
  IMPLEMENTATION_PLAN: "Implementation Plan",
};

/** Generation order for Chain of Prompts */
export const COP_GENERATION_ORDER: DocumentName[] = [
  "PRD",
  "ARCHITECTURE",
  "AGENTS",
  "RULES",
  "WORKFLOW",
  "SKILLS_MATRIX",
  "IMPLEMENTATION_PLAN",
];

/** A generated document */
export interface GeneratedDocument {
  name: DocumentName;
  filename: string;
  content: string;
  generatedAt: number;
}

export type DocumentProgressStatus =
  | "pending"
  | "generating"
  | "completed"
  | "error"
  | "stale";

export type DocumentProgressState = Record<
  DocumentName,
  DocumentProgressStatus
>;

export const DOCUMENT_DEPENDENCIES: Record<DocumentName, DocumentName[]> = {
  PRD: [],
  ARCHITECTURE: ["PRD"],
  AGENTS: ["PRD", "ARCHITECTURE"],
  RULES: ["PRD", "ARCHITECTURE"],
  WORKFLOW: ["PRD", "ARCHITECTURE", "RULES"],
  SKILLS_MATRIX: ["ARCHITECTURE", "AGENTS"],
  IMPLEMENTATION_PLAN: ["PRD", "ARCHITECTURE", "AGENTS"],
};

/** Generation progress status */
export type GenerationStatus = "idle" | "generating" | "completed" | "error";

/** Payload sent to /api/generate */
export interface GeneratePayload {
  mustHaves: MustHavesState;
}

/** Response from /api/generate for a single document */
export interface GenerateDocumentResponse {
  name: DocumentName;
  content: string;
}

/** Full response from /api/generate */
export interface GenerateResponse {
  documents: GenerateDocumentResponse[];
}

/** Payload for conversational tweaking */
export interface TweakPayload {
  documentName: DocumentName;
  currentContent: string;
  userInstruction: string;
  mustHaves: MustHavesState;
}

/** Response from tweaking endpoint */
export interface TweakResponse {
  updatedContent: string;
}
