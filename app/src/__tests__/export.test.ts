import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  downloadAsMarkdown,
  downloadCombinedMarkdown,
  markdownToSimpleHtml,
  markdownToPdfHtml,
} from "@/lib/export";
import type { GeneratedDocument } from "@/types/schema";

const renderMermaidSvgMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/mermaid-client", () => ({
  renderMermaidSvg: renderMermaidSvgMock,
}));

describe("export utilities", () => {
  let createObjectURLMock: any;
  let revokeObjectURLMock: any;
  let clickMock: any;
  let appendChildMock: any;
  let removeChildMock: any;

  beforeEach(() => {
    renderMermaidSvgMock.mockReset();
    createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
    revokeObjectURLMock = vi.fn();
    clickMock = vi.fn();
    appendChildMock = vi.fn();
    removeChildMock = vi.fn();

    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    // Mock document.createElement for anchor tag
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "a") {
        return {
          href: "",
          download: "",
          click: clickMock,
        } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tagName);
    });

    document.body.appendChild = appendChildMock;
    document.body.removeChild = removeChildMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("downloadAsMarkdown", () => {
    it("should trigger download with correct filename and content", () => {
      const doc: GeneratedDocument = {
        name: "PRD",
        filename: "PRD.md",
        content: "# Product Requirements Document\n\nTest content",
        generatedAt: Date.now(),
      };

      downloadAsMarkdown(doc);

      expect(createObjectURLMock).toHaveBeenCalledOnce();
      expect(clickMock).toHaveBeenCalledOnce();
      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");
    });

    it("should handle empty content gracefully", () => {
      const doc: GeneratedDocument = {
        name: "AGENTS",
        filename: "AGENTS.md",
        content: "",
        generatedAt: Date.now(),
      };

      downloadAsMarkdown(doc);

      expect(createObjectURLMock).toHaveBeenCalledOnce();
      expect(clickMock).toHaveBeenCalledOnce();
    });

    it("should handle special characters in content", () => {
      const doc: GeneratedDocument = {
        name: "AGENTS",
        filename: "AGENTS.md",
        content: "# Agents\n\n- 😎 Emojis\n- 中文 characters\n- !@#$%^&*()",
        generatedAt: Date.now(),
      };

      downloadAsMarkdown(doc);

      expect(createObjectURLMock).toHaveBeenCalledOnce();
      expect(clickMock).toHaveBeenCalledOnce();
    });
  });

  describe("downloadCombinedMarkdown", () => {
    it("should bundle all documents into a single file with table of contents", () => {
      const docs: GeneratedDocument[] = [
        {
          name: "PRD",
          filename: "PRD.md",
          content: "PRD body",
          generatedAt: Date.now(),
        },
        {
          name: "ARCHITECTURE",
          filename: "ARCHITECTURE.md",
          content: "Architecture body",
          generatedAt: Date.now(),
        },
      ];

      downloadCombinedMarkdown(docs);

      expect(createObjectURLMock).toHaveBeenCalledOnce();
      expect(clickMock).toHaveBeenCalledOnce();
    });
  });

  describe("markdownToSimpleHtml", () => {
    it("should convert headings and code blocks to structured HTML", () => {
      const md = "## Title\n\n```js\nconsole.log('hello');\n```";
      const html = markdownToSimpleHtml(md);

      expect(html).toContain("<h2");
      expect(html).toContain("Title</h2>");
      expect(html).toContain("<pre");
      expect(html).toContain("<code");
    });

    it("should convert markdown tables to HTML tables", () => {
      const md = "| Col1 | Col2 |\n|---|---|\n| Val1 | Val2 |";
      const html = markdownToSimpleHtml(md);

      expect(html).toContain("<table");
      expect(html).toContain("<th");
      expect(html).toContain("Col1</th>");
      expect(html).toContain("<td");
      expect(html).toContain("Val1</td>");
    });

    it("should escape raw HTML before PDF rendering", () => {
      const html = markdownToSimpleHtml(
        '<img src=x onerror="alert(1)"><script>alert(2)</script>'
      );

      expect(html).not.toContain("<script>");
      expect(html).not.toContain("<img src=x");
      expect(html).toContain("&lt;script&gt;");
    });
  });

  describe("markdownToPdfHtml", () => {
    it("embeds rendered Mermaid SVG in the PDF HTML", async () => {
      renderMermaidSvgMock.mockResolvedValue("<svg><text>Flow</text></svg>");

      const html = await markdownToPdfHtml(
        "## Flow\n\n```mermaid\nflowchart TD\nA-->B\n```"
      );

      expect(html).toContain("<svg><text>Flow</text></svg>");
      expect(html).not.toContain("MERMAID_DIAGRAM_0_PLACEHOLDER");
    });

    it("keeps escaped Mermaid source when PDF rendering fails", async () => {
      renderMermaidSvgMock.mockRejectedValue(new Error("Invalid"));

      const html = await markdownToPdfHtml(
        "```mermaid\nflowchart TD\nA[<unsafe>]-->B\n```"
      );

      expect(html).toContain("Diagram belum dapat ditampilkan");
      expect(html).toContain("&lt;unsafe&gt;");
      expect(html).not.toContain("A[<unsafe>]");
    });
  });
});
