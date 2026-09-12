import { describe, expect, it } from "vitest";
import {
  isMermaidSource,
  normalizeMermaidMarkdown,
  sanitizeMermaidSource,
} from "@/lib/mermaid-markdown";

describe("Mermaid Markdown normalization", () => {
  it.each([
    "flowchart TD\n  A --> B",
    "flowchart LR\n  A --> B",
    "graph TD\n  A --> B",
    "sequenceDiagram\n  Alice->>Bob: Hello",
    "gitGraph\n  commit",
  ])("recognizes supported diagram syntax: %s", (source) => {
    expect(isMermaidSource(source)).toBe(true);
  });

  it("labels an unlabeled Mermaid fence", () => {
    const result = normalizeMermaidMarkdown(
      "```\nflowchart TD\n  A --> B\n```"
    );

    expect(result).toBe("```mermaid\nflowchart TD\n  A --> B\n```");
  });

  it("repairs a Mermaid directive incorrectly used as fence info", () => {
    const result = normalizeMermaidMarkdown(
      "```flowchart LR\n  A --> B\n```"
    );

    expect(result).toBe("```mermaid\nflowchart LR\n  A --> B\n```");
  });

  it("does not reinterpret arbitrary code as Mermaid", () => {
    const source = "```ts\nconst graph = 'TD';\n```";
    expect(normalizeMermaidMarkdown(source)).toBe(source);
  });

  it("sanitizes bare flowchart directive and quotes problematic node labels", () => {
    const raw = "```mermaid\nflowchart\nA[Next.js (App Router)] --> B[Edge API: Workers]\n```";
    const result = normalizeMermaidMarkdown(raw);
    expect(result).toContain("flowchart TD");
    expect(result).toContain('A["Next.js (App Router)"]');
    expect(result).toContain('B["Edge API: Workers"]');
  });

  it("separates code fences glued directly to markdown headings", () => {
    const raw = "```mermaid\nflowchart TD\nA --> B\n```### Component Responsibilities\nDetails here";
    const result = normalizeMermaidMarkdown(raw);
    expect(result).toContain("```\n\n### Component Responsibilities");
  });

  describe("sanitizeMermaidSource comprehensive node shape support", () => {
    it("sanitizes pill / rounded nodes ([ ... ]) including nested parentheses and agent tags", () => {
      const source = "flowchart TD\nStart([Feature Request]) --> PRD([Feature Request (New)]) --> Agent([@product-manager: Review])";
      const result = sanitizeMermaidSource(source);
      expect(result).toContain('Start(["Feature Request"])');
      expect(result).toContain('PRD(["Feature Request (New)"])');
      expect(result).toContain('Agent(["@product-manager: Review"])');
    });

    it("does not double-quote already quoted pill nodes", () => {
      const source = 'flowchart TD\nStart(["Feature Request"]) --> End(["Done"])';
      const result = sanitizeMermaidSource(source);
      expect(result).toContain('Start(["Feature Request"])');
      expect(result).toContain('End(["Done"])');
      expect(result).not.toContain('Start([\\"');
      expect(result).not.toContain('Start([""');
    });

    it("sanitizes database / cylinder nodes [( ... )] including nested parentheses and ports", () => {
      const source = "flowchart TD\nDB1[(PostgreSQL Database)] --> DB2[(PostgreSQL (Primary) :5432)]";
      const result = sanitizeMermaidSource(source);
      expect(result).toContain('DB1[("PostgreSQL Database")]');
      expect(result).toContain('DB2[("PostgreSQL (Primary) :5432")]');
      // Must remain database shape, not corrupted into a regular rectangle
      expect(result).not.toContain('DB1["(');
      expect(result).not.toContain('DB2["(');
    });

    it("does not double-quote already quoted database nodes", () => {
      const source = 'flowchart TD\nDB[("PostgreSQL Database")]';
      const result = sanitizeMermaidSource(source);
      expect(result).toContain('DB[("PostgreSQL Database")]');
      expect(result).not.toContain('DB[(""');
    });

    it("sanitizes decision nodes { ... } when special characters are present", () => {
      const source = "flowchart TD\nCheck{Is Valid?} -->|Yes| Auth{Role: Admin & @dev}\nAuth --> Simple{IsValid}";
      const result = sanitizeMermaidSource(source);
      expect(result).toContain('Check{"Is Valid?"}');
      expect(result).toContain('Auth{"Role: Admin & @dev"}');
      // Simple decision without special characters remains untouched
      expect(result).toContain("Simple{IsValid}");
    });

    it("does not double-quote already quoted decision nodes", () => {
      const source = 'flowchart TD\nCheck{"Is Valid?"}';
      const result = sanitizeMermaidSource(source);
      expect(result).toContain('Check{"Is Valid?"}');
      expect(result).not.toContain('Check{""');
    });

    it("sanitizes hexagon nodes {{ ... }} and avoids collisions with decision nodes", () => {
      const source = "flowchart TD\nHex1{{Manual Review}} --> Hex2{{Process (Async) : Urgent}}";
      const result = sanitizeMermaidSource(source);
      expect(result).toContain('Hex1{{"Manual Review"}}');
      expect(result).toContain('Hex2{{"Process (Async) : Urgent"}}');
      // Must remain hexagon syntax, not converted into decision syntax
      expect(result).not.toMatch(/Hex1\{"[^"]+"\}(?!\})/);
    });

    it("does not double-quote already quoted hexagon nodes", () => {
      const source = 'flowchart TD\nHex{{"Manual Review"}}';
      const result = sanitizeMermaidSource(source);
      expect(result).toContain('Hex{{"Manual Review"}}');
      expect(result).not.toContain('Hex{{""');
    });

    it("sanitizes circle nodes (( ... ))", () => {
      const source = "flowchart TD\nUser((End User)) --> Admin((Admin: @security (Global)))";
      const result = sanitizeMermaidSource(source);
      expect(result).toContain('User(("End User"))');
      expect(result).toContain('Admin(("Admin: @security (Global)"))');
    });

    it("does not double-quote already quoted circle nodes", () => {
      const source = 'flowchart TD\nUser(("End User"))';
      const result = sanitizeMermaidSource(source);
      expect(result).toContain('User(("End User"))');
      expect(result).not.toContain('User((""');
    });

    it("sanitizes asymmetric / flag nodes > ... ]", () => {
      const source = "flowchart TD\nFlag>Special Note: Important (v1)]";
      const result = sanitizeMermaidSource(source);
      expect(result).toContain('Flag>"Special Note: Important (v1)"]');
    });

    it("does not double-quote already quoted asymmetric nodes", () => {
      const source = 'flowchart TD\nFlag>"Special Note: Important (v1)"]';
      const result = sanitizeMermaidSource(source);
      expect(result).toContain('Flag>"Special Note: Important (v1)"]');
      expect(result).not.toContain('Flag>""');
    });

    it("sanitizes regular box nodes [ ... ] and preserves plain boxes", () => {
      const source = "flowchart TD\nA[Next.js (App Router)] --> BE[@backend-data-engineer] --> C[Plain Box] --> D[\"Already Quoted\"]";
      const result = sanitizeMermaidSource(source);
      expect(result).toContain('A["Next.js (App Router)"]');
      expect(result).toContain('BE["@backend-data-engineer"]');
      expect(result).toContain("C[Plain Box]");
      expect(result).toContain('D["Already Quoted"]');
    });

    it("correctly sanitizes a comprehensive diagram with all node shapes without cross-contamination", () => {
      const complex = [
        "flowchart TD",
        "  Start([Feature Request (PRD)]) --> Check{Is Valid? @dev}",
        "  Check -->|Yes| DB[(PostgreSQL (Primary) :5432)]",
        "  Check -->|No| Hex{{Manual Review: (Ops)}}",
        "  DB --> User((End User (@all)))",
        "  User --> Flag>Special Note: (v1)]",
        "  Flag --> Done[All Finished: (Complete)]",
      ].join("\n");

      const sanitized = sanitizeMermaidSource(complex);
      expect(sanitized).toContain('Start(["Feature Request (PRD)"])');
      expect(sanitized).toContain('Check{"Is Valid? @dev"}');
      expect(sanitized).toContain('DB[("PostgreSQL (Primary) :5432")]');
      expect(sanitized).toContain('Hex{{"Manual Review: (Ops)"}}');
      expect(sanitized).toContain('User(("End User (@all)"))');
      expect(sanitized).toContain('Flag>"Special Note: (v1)"]');
      expect(sanitized).toContain('Done["All Finished: (Complete)"]');
    });
  });
});


