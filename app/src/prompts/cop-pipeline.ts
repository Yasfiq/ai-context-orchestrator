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
- Be comprehensive but concise — no filler content.
- Use proper Markdown headings (##, ###), bullet points, and code blocks where appropriate.
- Every diagram MUST use a fenced Mermaid block with the exact language tag \`\`\`mermaid. The first line inside the fence must be a valid Mermaid directive such as \`flowchart TD\`, \`sequenceDiagram\`, \`graph LR\`, or \`gitGraph\`.
- Never place a Mermaid directive in the code-fence language tag (for example, never write \`\`\`flowchart TD).
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
 * Renders reference blocks for every dependency of a document.
 * Kept byte-identical to the previous per-builder hardcoding: each
 * dependency renders as "\n## REFERENCE: <LABEL>\n<content>\n".
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
      return `\n## REFERENCE: ${dep}\n${depContent}\n`;
    })
    .join("\n");
}

interface DocumentSpec {
  role: string;
  requirements: string;
}

const DOCUMENT_SPECS: Record<DocumentName, DocumentSpec> = {
  PRD: {
    role: "You are a senior product manager creating a Product Requirements Document (PRD).",
    requirements: `
Generate a comprehensive PRD with the following sections:

1. **Product Vision & Problem Statement** — What problem does this product solve? Why does it matter?
2. **Target Users** — Who are the primary users? Include user personas if relevant.
3. **Core Features (MVP Scope)** — List 3-5 core features with detailed descriptions. For each feature, include:
   - Feature name and description
   - User story (As a [user], I want to [action], so that [benefit])
   - Acceptance criteria
4. **Non-Functional Requirements** — Performance, security, scalability expectations.
5. **Tech Stack Overview** — High-level technology decisions and rationale.
6. **Out of Scope (MVP)** — What is explicitly NOT included in this phase.
7. **Success Metrics** — How will we measure if this product is successful?
8. **Risks & Mitigation** — Key risks and how to address them.

Make it detailed enough that a development team can start building from this document.`,
  },
  ARCHITECTURE: {
    role: "You are a senior software architect designing the system architecture.",
    requirements: `
Generate an Architecture document with the following sections:

1. **Technology Stack** — List every major technology/library/framework with rationale for each choice.
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
    role: "You are an expert in AI-assisted development workflows, creating an AGENTS.md file.",
    requirements: `
Generate an AGENTS.md file that defines AI agent personas for this project. For each agent:

1. **Agent Tag** — A unique identifier (e.g., @frontend-specialist, @backend-engineer)
2. **Role** — A one-line description of the agent's expertise and focus area.
3. **Technology Focus** — Specific technologies this agent specializes in.
4. **Responsibilities** — 3-5 bullet points of what this agent handles.
5. **Strict Rules** — 2-3 hard constraints the agent must follow.
6. **Response Format** — How the agent should format its responses.

Create agents that cover:
- Frontend/UI development
- Backend/API development
- Architecture & system design
- Quality assurance & testing
- Any domain-specific agents relevant to the project

Each agent should be distinct with clear boundaries. Avoid overlap in responsibilities.`,
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
