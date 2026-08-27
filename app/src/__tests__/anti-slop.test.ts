import { describe, it, expect } from "vitest";
import { cleanAntiSlop, calculateSlopScore } from "@/lib/anti-slop";
import { validateModelDocument } from "@/lib/llm-output";

describe("Anti-Slop Engine & Cleaner", () => {
  describe("cleanAntiSlop()", () => {
    it("should remove conclusion filler preambles", () => {
      const input = `## Overview\nThis is a system.\n\nIn conclusion, the architecture is solid.`;
      const cleaned = cleanAntiSlop(input);
      expect(cleaned).not.toMatch(/In conclusion,/i);
      expect(cleaned).toContain("the architecture is solid.");
    });

    it("should clean Indonesian filler preambles", () => {
      const input = `## Ringkasan\nSistem ini handal.\n\nKesimpulannya, arsitektur Next.js sangat cocok.`;
      const cleaned = cleanAntiSlop(input);
      expect(cleaned).not.toMatch(/Kesimpulannya,/i);
      expect(cleaned).toContain("arsitektur Next.js sangat cocok.");
    });

    it("should replace English AI buzzwords with concise technical terms", () => {
      const input = `This tool will revolutionize development and seamlessly integrate with our API. Let us delve into the architecture. It is a game-changer and a testament to modern engineering.`;
      const cleaned = cleanAntiSlop(input);

      expect(cleaned).not.toMatch(/\brevolutionize\b/i);
      expect(cleaned).not.toMatch(/\bseamlessly\b/i);
      expect(cleaned).not.toMatch(/\bdelve into\b/i);
      expect(cleaned).not.toMatch(/\bgame-changer\b/i);
      expect(cleaned).not.toMatch(/\ba testament to\b/i);

      expect(cleaned).toContain("modernize");
      expect(cleaned).toContain("integrates directly");
      expect(cleaned).toContain("examine");
    });

    it("should replace Indonesian AI buzzwords with technical terms", () => {
      const input = `Aplikasi ini akan merevolusi alur kerja secara tanpa hambatan dan menyelami kebutuhan developer.`;
      const cleaned = cleanAntiSlop(input);

      expect(cleaned).not.toMatch(/\bmerevolusi\b/i);
      expect(cleaned).not.toMatch(/\btanpa hambatan\b/i);
      expect(cleaned).not.toMatch(/\bmenyelami\b/i);

      expect(cleaned).toContain("memodernisasi");
      expect(cleaned).toContain("terintegrasi langsung");
      expect(cleaned).toContain("membahas");
    });

    it("should strictly preserve Mermaid diagrams without modifying syntax or nodes", () => {
      const input = `## Architecture Flow
Berikut adalah arsitektur sistem:

\`\`\`mermaid
flowchart TD
    A[delve into service] --> B[seamlessly integrate DB]
    B --> C[revolutionize UI]
\`\`\`

Arsitektur ini akan merevolusi cara kerja.`;

      const cleaned = cleanAntiSlop(input);

      // Markdown narrative should be cleaned
      expect(cleaned).not.toContain("akan merevolusi cara kerja");
      expect(cleaned).toContain("akan memodernisasi cara kerja");

      // Mermaid diagram block MUST remain untouched inside the code fence
      expect(cleaned).toContain("A[delve into service] --> B[seamlessly integrate DB]");
      expect(cleaned).toContain("B --> C[revolutionize UI]");
    });

    it("should strictly preserve inline code and code fences", () => {
      const input = `Use function \`revolutionize()\` and variable \`is_seamless\`.

\`\`\`typescript
export function delveInto(param: string): void {
  const revolutionize = true;
}
\`\`\`
`;
      const cleaned = cleanAntiSlop(input);

      expect(cleaned).toContain("`revolutionize()`");
      expect(cleaned).toContain("`is_seamless`");
      expect(cleaned).toContain("export function delveInto(param: string): void {");
      expect(cleaned).toContain("const revolutionize = true;");
    });
  });

  describe("calculateSlopScore()", () => {
    it("should return score 0 for clean technical text", () => {
      const text = `## API Specification\nThe endpoint accepts JSON payload and responds with HTTP 200.`;
      const result = calculateSlopScore(text);
      expect(result.score).toBe(0);
      expect(result.slopCount).toBe(0);
    });

    it("should detect slop count and calculate density score", () => {
      const text = `We delve into the system to seamlessly integrate and revolutionize the whole platform. In conclusion, it is great.`;
      const result = calculateSlopScore(text);
      expect(result.slopCount).toBeGreaterThanOrEqual(3);
      expect(result.score).toBeGreaterThan(0);
      expect(result.matches.length).toBeGreaterThan(0);
    });
  });

  describe("Integration with validateModelDocument()", () => {
    it("should sanitize slop automatically when validating model document", () => {
      const rawLLMOutput = `## System PRD Specification Overview

This platform will revolutionize API orchestration for modern development teams.
We delve into core components to seamlessly integrate state and eliminate inconsistencies.
The system provides robust mechanisms for stateless execution and high resilience across services.

\`\`\`mermaid
flowchart LR
    A[Client Request] --> B[Route Handler]
    B --> C[LLM Processing]
    C --> D[Validated Response]
\`\`\`

In conclusion, this document satisfies all technical requirements and compliance criteria.`;

      const validated = validateModelDocument(rawLLMOutput, "stop");

      expect(validated.content).not.toContain("revolutionize");
      expect(validated.content).not.toContain("seamlessly");
      expect(validated.content).not.toContain("delve into");
      expect(validated.content).not.toMatch(/In conclusion,/i);

      expect(validated.content).toContain("flowchart LR");
      expect(validated.content).toContain("modernize API orchestration");
      expect(validated.content).toContain("integrates directly state");
    });
  });
});

  describe("Anti-Slop False Positives & Edge Cases", () => {
    it("does not mutate URLs or markdown links containing keywords", () => {
      const input = `Reference: [Revolutionize Docs](https://example.com/revolutionize-api) and https://github.com/delve/seamless-lib`;
      const cleaned = cleanAntiSlop(input);
      expect(cleaned).toContain("https://example.com/revolutionize-api");
      expect(cleaned).toContain("https://github.com/delve/seamless-lib");
    });

    it("does not corrupt json structure inside markdown code block", () => {
      const input = `\`\`\`json
{
  "service": "seamless-auth",
  "action": "revolutionize",
  "status": "active"
}
\`\`\``;
      const cleaned = cleanAntiSlop(input);
      expect(cleaned).toBe(input);
    });

    it("does not alter variable names in backticks", () => {
      const input = `Setting \`is_seamless = true\` and \`delve_depth = 5\` is standard.`;
      const cleaned = cleanAntiSlop(input);
      expect(cleaned).toContain("`is_seamless = true`");
      expect(cleaned).toContain("`delve_depth = 5`");
    });

    it("handles complex multi-block markdown without dropping fences", () => {
      const input = `## Section 1
We examine the database.

\`\`\`typescript
const a = 1;
\`\`\`

## Section 2
\`\`\`mermaid
flowchart TD
  A --> B
\`\`\`

\`\`\`bash
npm run build
\`\`\`
`;
      const cleaned = cleanAntiSlop(input);
      expect(cleaned).toContain("```typescript");
      expect(cleaned).toContain("```mermaid");
      expect(cleaned).toContain("```bash");
    });
  });
