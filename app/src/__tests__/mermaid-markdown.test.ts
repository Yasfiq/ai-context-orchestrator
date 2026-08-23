import { describe, expect, it } from "vitest";
import {
  isMermaidSource,
  normalizeMermaidMarkdown,
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
});

