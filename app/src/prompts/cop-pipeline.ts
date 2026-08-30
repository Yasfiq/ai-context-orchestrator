import { ANTI_SLOP_DIRECTIVES } from "@/prompts/anti-slop-prompt";
import { sanitizeText } from "@/lib/sanitize";
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

/**
 * Build a CoP prompt for a specific document type.
 * Each document may receive previously generated documents as additional context.
 */
export function buildCopPrompt(
  documentName: DocumentName,
  mustHaves: MustHavesState,
  previousDocuments: Record<string, string> = {}
): string {
  const context = formatMustHavesContext(mustHaves);

  switch (documentName) {
    case "PRD":
      return buildPrdPrompt(context);
    case "ARCHITECTURE":
      return buildArchitecturePrompt(context, previousDocuments);
    case "AGENTS":
      return buildAgentsPrompt(context, previousDocuments);
    default:
      throw new Error(`Unknown document type: ${documentName}`);
  }
}

function buildPrdPrompt(context: string): string {
  return `You are a senior product manager creating a Product Requirements Document (PRD).
${BASE_INSTRUCTION}

## PROJECT CONTEXT
${context}

## DOCUMENT REQUIREMENTS
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

Make it detailed enough that a development team can start building from this document.`;
}

function isValidDoc(content?: string): boolean {
  if (!content || typeof content !== "string") return false;
  const trimmed = content.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith("> ⚠️ Error generating")) return false;
  return true;
}

function buildArchitecturePrompt(
  context: string,
  previousDocs: Record<string, string>
): string {
  const prdContext = isValidDoc(previousDocs["PRD"])
    ? `\n## REFERENCE: PRD\n${sanitizeText(previousDocs["PRD"], 2000)}\n`
    : "";

  return `You are a senior software architect designing the system architecture.
${BASE_INSTRUCTION}

## PROJECT CONTEXT
${context}
${prdContext}

## DOCUMENT REQUIREMENTS
Generate an Architecture document with the following sections:

1. **Technology Stack** — List every major technology/library/framework with rationale for each choice.
2. **High-Level System Architecture** — Describe the system components and how they interact. Include a Mermaid diagram using the required \`\`\`mermaid fence if applicable.
3. **Directory & File Structure** — Provide a detailed folder structure using a code block tree format. Explain the purpose of each major directory.
4. **Data Flow** — How data moves through the system (user input → processing → output).
5. **State Management** — How application state is managed, what state exists, and where it lives.
6. **API Design** — Endpoints, request/response formats, and authentication strategy.
7. **Security Architecture** — How security is enforced at each layer.
8. **Deployment Architecture** — How the app will be deployed and scaled.

Ensure the architecture aligns with the tech stack and features described in the PRD.`;
}

function buildAgentsPrompt(
  context: string,
  previousDocs: Record<string, string>
): string {
  const prdContext = isValidDoc(previousDocs["PRD"])
    ? `\n## REFERENCE: PRD\n${previousDocs["PRD"]}\n`
    : "";
  const archContext = isValidDoc(previousDocs["ARCHITECTURE"])
    ? `\n## REFERENCE: ARCHITECTURE\n${previousDocs["ARCHITECTURE"]}\n`
    : "";

  return `You are an expert in AI-assisted development workflows, creating an AGENTS.md file.
${BASE_INSTRUCTION}

## PROJECT CONTEXT
${context}
${prdContext}
${archContext}

## DOCUMENT REQUIREMENTS
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

Each agent should be distinct with clear boundaries. Avoid overlap in responsibilities.`;
}

function buildRulesPrompt(
  context: string,
  previousDocs: Record<string, string>
): string {
  const prdContext = isValidDoc(previousDocs["PRD"])
    ? `\n## REFERENCE: PRD\n${previousDocs["PRD"]}\n`
    : "";
  const archContext = isValidDoc(previousDocs["ARCHITECTURE"])
    ? `\n## REFERENCE: ARCHITECTURE\n${previousDocs["ARCHITECTURE"]}\n`
    : "";

  return `You are a tech lead establishing coding rules and conventions for a development team.
${BASE_INSTRUCTION}

## PROJECT CONTEXT
${context}
${prdContext}
${archContext}

## DOCUMENT REQUIREMENTS
Generate a RULES.md document with the following sections:

1. **Scope Boundaries** — What is explicitly in/out of scope. Hard limits on feature creep.
2. **Architecture & State Management Rules** — Mandatory patterns, forbidden anti-patterns.
3. **Code Naming Conventions** — File naming (kebab-case, PascalCase, etc.), variable naming (camelCase), type/interface naming conventions.
4. **Styling & UI/UX Rules** — Mandatory UI framework usage, color palette, animation guidelines.
5. **Security & Guardrails** — Input validation rules, API key handling, error exposure prevention.
6. **Error Handling Standards** — How errors should be caught, logged, and displayed to users.
7. **Git & Version Control** — Commit message format, branch naming, PR requirements.
8. **Performance Guidelines** — Bundle size limits, lazy loading requirements, caching strategies.

Each rule should be actionable and enforceable. Use "MUST", "MUST NOT", "SHOULD", "SHOULD NOT" language for clarity.`;
}

function buildWorkflowPrompt(
  context: string,
  previousDocs: Record<string, string>
): string {
  const prdContext = isValidDoc(previousDocs["PRD"])
    ? `\n## REFERENCE: PRD\n${previousDocs["PRD"]}\n`
    : "";
  const archContext = isValidDoc(previousDocs["ARCHITECTURE"])
    ? `\n## REFERENCE: ARCHITECTURE\n${previousDocs["ARCHITECTURE"]}\n`
    : "";
  const rulesContext = isValidDoc(previousDocs["RULES"])
    ? `\n## REFERENCE: RULES\n${previousDocs["RULES"]}\n`
    : "";

  return `You are a DevOps and process engineering specialist creating a workflow document.
${BASE_INSTRUCTION}

## PROJECT CONTEXT
${context}
${prdContext}
${archContext}
${rulesContext}

## DOCUMENT REQUIREMENTS
Generate a WORKFLOW.md document with the following sections:

1. **Git Branching Strategy** — Branch naming conventions, merge strategy (squash, rebase, etc.), protected branches.
2. **Development Workflow** — Step-by-step process from picking up a task to deployment.
3. **Code Review Standards** — What reviewers should check, approval requirements, review SLA.
4. **CI/CD Pipeline** — Build, test, lint, deploy stages. What runs on each trigger.
5. **Environment Management** — Development, staging, production environment specifications.
6. **Testing Workflow** — When and how to write tests, coverage requirements, test naming.
7. **Release Process** — Versioning strategy (semver), changelog generation, release checklist.
8. **Incident Response** — How to handle production issues, rollback procedures, post-mortem process.

Make workflows practical and immediately implementable by the development team.`;
}

function buildSkillsMatrixPrompt(
  context: string,
  previousDocs: Record<string, string>
): string {
  const agentsContext = isValidDoc(previousDocs["AGENTS"])
    ? `\n## REFERENCE: AGENTS\n${previousDocs["AGENTS"]}\n`
    : "";
  const archContext = isValidDoc(previousDocs["ARCHITECTURE"])
    ? `\n## REFERENCE: ARCHITECTURE\n${previousDocs["ARCHITECTURE"]}\n`
    : "";

  return `You are a project coordinator creating a skills matrix for AI-assisted development.
${BASE_INSTRUCTION}

## PROJECT CONTEXT
${context}
${agentsContext}
${archContext}

## DOCUMENT REQUIREMENTS
Generate a SKILLS_MATRIX.md document that maps tasks to the appropriate AI agents. Include:

1. **Agent Overview Table** — A Markdown table listing all agents, their primary domain, and expertise level.
2. **Task-to-Agent Mapping** — For each major feature/component area:
   - Which agent should be called for which task
   - When to use which agent (decision criteria)
   - Example prompts for invoking each agent
3. **Collaboration Patterns** — When multiple agents need to work together:
   - Agent handoff sequences (e.g., architect designs → frontend implements)
   - Cross-cutting concerns that need multiple agents
4. **Escalation Matrix** — When a task exceeds an agent's scope, who to escalate to.
5. **Prompt Templates** — 2-3 ready-to-use prompt templates per agent, tailored to this project's specific tech stack and features.

The goal is to give the developer a quick-reference guide so they always know which agent to call for any given task.`;
}

function buildImplementationPlanPrompt(
  context: string,
  previousDocs: Record<string, string>
): string {
  const prdContext = isValidDoc(previousDocs["PRD"])
    ? `\n## REFERENCE: PRD\n${previousDocs["PRD"]}\n`
    : "";
  const archContext = isValidDoc(previousDocs["ARCHITECTURE"])
    ? `\n## REFERENCE: ARCHITECTURE\n${previousDocs["ARCHITECTURE"]}\n`
    : "";
  const agentsContext = isValidDoc(previousDocs["AGENTS"])
    ? `\n## REFERENCE: AGENTS\n${previousDocs["AGENTS"]}\n`
    : "";

  return `You are a senior tech lead breaking down a product into micro-implementation tasks.
${BASE_INSTRUCTION}

## PROJECT CONTEXT
${context}
${prdContext}
${archContext}
${agentsContext}

## DOCUMENT REQUIREMENTS
Generate an IMPLEMENTATION_PLAN.md document with detailed, sequential phases. For each phase:

1. **Phase Name & Objective** — Clear one-line goal.
2. **Prerequisites** — What must be completed before starting this phase.
3. **Steps** — Numbered micro-tasks. Each step should be:
   - Small enough to complete in one AI prompt session
   - Specific enough that the developer knows exactly what to build
   - Include the recommended agent tag to use (from AGENTS.md)
4. **Completion Criteria** — How to verify the phase is done.
5. **Estimated Complexity** — Low / Medium / High per step.

Guidelines:
- Break features from the PRD into the smallest possible implementation units.
- Order phases logically: foundation → data layer → UI → business logic → integration → polish.
- Each step should be a self-contained micro-prompt that won't overwhelm the AI with cognitive load.
- Include setup/config phases at the beginning and testing/polish phases at the end.
- Aim for 5-8 phases with 3-6 steps each.

This document is the developer's roadmap for building the entire application using AI-assisted coding.`;
}
