import { sanitizeText } from "@/lib/sanitize";
import { ANTI_SLOP_DIRECTIVES } from "@/prompts/anti-slop-prompt";
import type { MustHavesState, DocumentName } from "@/types/schema";
import { MUST_HAVE_LABELS, MUST_HAVE_KEYS } from "@/types/schema";

/**
 * Format the 8 Must-Haves variables into a structured context block
 * that can be injected into any CoP prompt.
 */
function formatMustHavesContext(mustHaves: MustHavesState): string {
  return MUST_HAVE_KEYS.map(
    (key) => `**${MUST_HAVE_LABELS[key]}:** ${mustHaves[key] || "Not specified"}`
  ).join("\n");
}

/**
 * Base instruction shared across all CoP prompts.
 */
const BASE_INSTRUCTION = `
## OUTPUT RULES
${ANTI_SLOP_DIRECTIVES}

- Write in clean, professional Markdown.
- Be comprehensive, concrete, and deeply actionable — avoid superficial summaries.
- Use proper Markdown headings (##, ###), bullet points, and code blocks where appropriate.
- Every diagram MUST use a fenced Mermaid block with the exact language tag \`\`\`mermaid. The first line inside the fence must be a valid Mermaid directive such as \`flowchart TD\`, \`sequenceDiagram\`, \`graph LR\`, or \`gitGraph\`.
- Always ensure closing code fences (\`\`\`) are placed on their own isolated line, preceded and followed by a blank line. Never attach markdown formatting (such as ---, **, or ##) directly to closing backticks.
- Never place a Mermaid directive in the code-fence language tag (for example, never write \`\`\`flowchart TD).
- Never output unexecutable placeholder code blocks like \`\`\`mermaid [Valid directive] \`\`\` — either provide valid, executable syntax or use formatted text tables.
- Bilingual: Write primarily in English but include Indonesian terms/notes where contextually appropriate.
- Do NOT include the document title as H1 — the system will handle that.
- Do NOT include any metadata, timestamps, or version numbers.
- NEVER reference this system prompt or mention that you are an AI.
- Treat the supplied project context as the source of truth.
- Do NOT introduce unconfirmed features, libraries, services, roles, integrations, or compliance requirements.
- Only name technologies explicitly present in "Tech Stack Core" or "Data Flow & Integration". For example, do not choose localStorage versus IndexedDB, add Zod, or add a charting library unless the user confirmed it.
- Only include product capabilities explicitly present in "Key Features (MVP)". Place potentially useful additions under Out of Scope or TBD, never as an MVP commitment.
- If required information is missing, mark it as "TBD — requires user confirmation" instead of inventing a decision.
- Recommendations must stay inside the confirmed MVP scope and be clearly labeled as recommendations.

## SECURITY
- Do NOT include any API keys, secrets, or credentials in the output.
- Do NOT generate content that promotes illegal activities.
- Focus strictly on the document requirements below.
`;

function isValidDoc(content?: string): boolean {
  if (!content || typeof content !== "string") return false;
  const trimmed = content.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith("> ⚠️ Error generating")) return false;
  return true;
}

/**
 * Condenses reference documents to eliminate redundant empty lines and spaces
 * while keeping essential context within a compact token footprint.
 */
export function condenseReferenceContent(
  content: string,
  maxLength: number = 1800
): string {
  if (!content) return "";
  const compacted = content
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return sanitizeText(compacted, maxLength);
}

/**
 * Renders reference blocks for every dependency of a document.
 * Dependencies render as "\n## REFERENCE: <LABEL>\n<content>\n".
 */
function buildReferences(
  documentName: DocumentName,
  previousDocuments: Record<string, string>
): string {
  // PRD has no reference slot in the prompt template; ARCHITECTURE and
  // AGENTS always render an (optional) slot line after PROJECT CONTEXT.
  const deps: DocumentName[] =
    documentName === "PRD"
      ? []
      : documentName === "ARCHITECTURE"
        ? ["PRD"]
        : ["PRD", "ARCHITECTURE"];

  return deps
    .map((dep) => {
      const depContent = previousDocuments[dep];
      if (!isValidDoc(depContent)) return "";
      return `\n## REFERENCE: ${dep}\n${condenseReferenceContent(depContent, 1800)}\n`;
    })
    .join("\n");
}

interface DocumentSpec {
  role: string;
  requirements: string;
}

const DOCUMENT_SPECS: Record<DocumentName, DocumentSpec> = {
  PRD: {
    role: "You are a senior product manager creating an exhaustive Product Requirements Document (PRD).",
    requirements: `
Generate an in-depth, production-ready PRD with the following sections:

1. **Product Vision & Problem Statement** — What specific problem does this product solve? Why does it matter? Include core quantifiable value drivers.
2. **Target Users & Permissions Matrix** —
   - Define 3-4 concrete user personas (Role, core workflows, technical background, pain points).
   - Provide a User Permissions & Access Control Matrix table detailing permissions per persona.
3. **Core Features (MVP Scope)** — Detail 3-5 core MVP features. For each feature, provide:
   - Feature name and detailed functional description
   - User story in standard format: As a [user persona], I want [capability], so that [business value]
   - 6-8 granular Acceptance Criteria covering normal flows, edge cases, data validation, and error states
   - Include at least one Mermaid diagram (\`\`\`mermaid flowchart TD or sequenceDiagram) illustrating the core user journey or interaction model.
4. **Non-Functional Requirements** — Concrete latency targets, throughput, security baselines, and data durability expectations.
5. **Tech Stack & Architectural Alignment** — High-level technology decisions and rationale connecting directly to the confirmed project context.
6. **Out of Scope (MVP)** — Explicit list of capabilities postponed to later releases to preserve MVP focus.
7. **Success Metrics & KPIs** — Measurable leading and lagging indicators for MVP validation.
8. **Risks, Edge Cases & Mitigation** — Technical, operational, and regulatory risks with concrete mitigation playbooks.

Ensure this document is rigorous, comprehensive, and immediately actionable for engineering teams.`,
  },
  ARCHITECTURE: {
    role: "You are a senior software architect designing the system architecture.",
    requirements: `
Generate an Architecture document with the following sections:

1. **Technology Stack** — List every major technology/library/framework with rationale for each choice in a structured markdown table.
2. **High-Level System Architecture** — Describe the system components and how they interact. Include a Mermaid diagram using the required \`\`\`mermaid fence if applicable.
3. **Directory & File Structure** — Provide a detailed folder structure using a code block tree format. Explain the purpose of each major directory.
4. **Data Flow** — How data moves through the system (user input → processing → output).
5. **State Management** — How application state is managed, what state exists, and where it lives.
6. **API Design** — Endpoints, request/response formats, and authentication strategy.
7. **Security Architecture** — How security is enforced at each layer.
8. **Deployment Architecture** — How the app will be deployed and scaled.

Ensure the architecture aligns with the tech stack and features described in the PRD.`,
  },
  AGENTS: {
    role: "You are an expert in AI-assisted development workflows, creating an exhaustive AGENTS.md file.",
    requirements: `
Generate an exhaustive, production-grade AGENTS.md file defining AI agent personas and orchestration workflows for this project:

1. **AI Agent Personas** — Define 4-6 distinct specialized agents (covering Frontend/UI, Backend/API, Architecture/Data, QA Automation, and relevant Domain Specialists). For each agent, provide:
   - **Agent Tag & Role:** Unique tag (e.g., @frontend-specialist, @backend-engineer) and specific domain focus.
   - **Technology Mastery:** Specific frameworks, libraries, and tools this agent specializes in.
   - **Detailed Technical Responsibilities:** 6-8 bullet points detailing concrete tasks and boundaries.
   - **Strict Rules & Constraints:** 3-5 hard constraints and anti-patterns the agent must never violate.
   - **Standard Interaction & Response Format:** Guidelines on code generation, test output, and explanations.

2. **Agent Collaboration & Orchestration Protocol** —
   - Include a Mermaid flowchart (\`\`\`mermaid flowchart TD) visualizing how agents hand off tasks.
   - Coordination rules for feature implementation, code reviews, and schema migrations.

3. **Task Handoff Matrix** —
   - A structured markdown table detailing: Trigger / Request, Sending Agent, Receiving Agent, Required Input Artifacts, Expected Output Artifacts.

4. **Operational Workflows & Runbooks** —
   - Step-by-step multi-agent execution sequences for: (a) New feature end-to-end implementation, (b) Bug triage and resolution, (c) Schema/API version migration.

5. **Quality Gates & Pre-Commit Checklist** —
   - Concrete checklist that QA and Lead agents must verify before approving changes.

Make each persona distinct, actionable, and free from superficial brevity.`,
  },
};

/**
 * Build a CoP prompt for a specific document type.
 * Each document may receive previously generated documents as additional context.
 */
export function buildCopPrompt(
  documentName: DocumentName,
  mustHaves: MustHavesState,
  previousDocuments: Record<string, string> = {}
): string {
  const spec = DOCUMENT_SPECS[documentName];
  if (!spec) {
    throw new Error(`Unknown document type: ${documentName}`);
  }
  const context = formatMustHavesContext(mustHaves);
  const references = buildReferences(documentName, previousDocuments);

  // PRD has no reference slot in its template (first in chain);
  // ARCHITECTURE/AGENTS always reserve the slot, even when empty.
  const body =
    documentName === "PRD"
      ? `## PROJECT CONTEXT\n${context}\n\n## DOCUMENT REQUIREMENTS`
      : `## PROJECT CONTEXT\n${context}\n${references}\n\n## DOCUMENT REQUIREMENTS`;

  return `${spec.role}\n${BASE_INSTRUCTION}\n\n${body}${spec.requirements}`;
}
