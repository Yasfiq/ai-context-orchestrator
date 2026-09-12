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
  maxLength: number = 1000
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
      return `\n## REFERENCE: ${dep}\n${condenseReferenceContent(depContent, 1000)}\n`;
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
   - Define 2-3 concrete user personas (Role, core workflows, technical background, pain points).
   - Provide a User Permissions & Access Control Matrix table detailing permissions per persona.
3. **Core Features (MVP Scope)** — Detail exactly 3 core MVP features (strict limit of 3 features to maintain sharp MVP focus). For each feature, provide:
   - Feature name and functional description
   - User story: As a [user persona], I want [capability], so that [business value]
   - 4-5 granular Acceptance Criteria covering normal flows, data validation, and error states
   - Include a Mermaid diagram (\`\`\`mermaid flowchart TD or sequenceDiagram) illustrating the core user journey or interaction model.
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
Generate a concise, production-grade Architecture document. Keep explanations dense and focused using tables and structured bullet points (avoid verbose narratives) with the following sections:

1. **Technology Stack** — List every core technology/framework with rationale in a structured markdown table.
2. **High-Level System Architecture** — Describe the core system components and their interactions. Include exactly one clean Mermaid diagram (\`\`\`mermaid flowchart TD or sequenceDiagram).
3. **Directory & File Structure** — Provide an essential directory tree in a code block highlighting core folders (keep to 20-30 lines).
4. **Data Flow** — Concise step-by-step lifecycle of a primary transaction/request.
5. **State Management** — Client and server state boundaries, stores, and caching strategy.
6. **API Design** — Define the top 4-6 essential REST/RPC endpoints in a clear markdown table (Method, Endpoint, Description, Auth, Sample Payload).
7. **Security Architecture** — Key authentication, authorization, and data encryption policies.
8. **Deployment Architecture** — Hosting, CI/CD pipeline, and scaling model.

Ensure the architecture aligns strictly with the PRD and confirmed tech stack.`,
  },
  AGENTS: {
    role: "You are an expert in AI-assisted development workflows, creating an exhaustive AGENTS.md file.",
    requirements: `
Generate a production-grade AGENTS.md file defining AI agent personas and orchestration workflows for this project. Keep formatting crisp, dense, and structured:

1. **AI Agent Personas** — Define 3 specialized agents (e.g., Frontend Specialist, Backend/Data Engineer, QA/Automation Specialist). For each agent, provide:
   - **Agent Tag & Role:** Unique tag (e.g., @frontend-specialist) and specific domain focus.
   - **Technology Mastery:** Specific frameworks, libraries, and tools this agent specializes in.
   - **Detailed Technical Responsibilities:** 3-4 bullet points detailing concrete tasks and boundaries.
   - **Strict Rules & Constraints:** 2-3 hard constraints and anti-patterns the agent must never violate.
   - **Standard Interaction & Response Format:** Brief guidelines on code generation, test output, and explanations.

2. **Agent Collaboration & Orchestration Protocol** —
   - Include a clean Mermaid flowchart (\`\`\`mermaid flowchart TD) visualizing how agents hand off tasks.
   - Coordination rules for feature implementation and code reviews.

3. **Task Handoff Matrix** —
   - A structured markdown table detailing: Trigger / Request, Sending Agent, Receiving Agent, Required Input Artifacts, Expected Output Artifacts.

4. **Operational Workflows & Runbooks** —
   - Step-by-step multi-agent execution sequences for: (a) New feature end-to-end implementation, (b) Bug triage and resolution.

5. **Quality Gates & Pre-Commit Checklist** —
   - Concrete checklist that QA and Lead agents must verify before approving changes.

Make each persona distinct, actionable, and focused on confirmed project context.`,
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
