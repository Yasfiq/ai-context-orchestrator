import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownRenderer } from "@/components/features/MarkdownRenderer";

vi.mock("@/lib/mermaid-client", () => ({
  renderMermaidSvg: vi.fn().mockResolvedValue("<svg><text>Mock Diagram</text></svg>"),
}));

describe("MarkdownRenderer", () => {
  it("renders headings, paragraphs, and inline code properly", () => {
    const md = "# Heading 1\n\nThis is a paragraph with `inline code`.";
    render(<MarkdownRenderer content={md} />);

    expect(screen.getByRole("heading", { level: 1, name: "Heading 1" })).toBeInTheDocument();
    expect(screen.getByText(/This is a paragraph with/)).toBeInTheDocument();
    expect(screen.getByText("inline code")).toBeInTheDocument();
  });

  it("renders code blocks with language badge and copy button", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

    const md = "```typescript\nconst greeting: string = 'hello';\n```";
    render(<MarkdownRenderer content={md} />);

    expect(screen.getByTestId("code-block")).toBeInTheDocument();
    expect(screen.getByText("typescript")).toBeInTheDocument();

    const copyButton = screen.getByRole("button", { name: "Salin kode" });
    expect(copyButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(writeTextMock).toHaveBeenCalledWith("const greeting: string = 'hello';");
    expect(screen.getByText("Disalin")).toBeInTheDocument();
  });

  it("renders mermaid diagrams instead of standard code block when language is mermaid", async () => {
    const md = "```mermaid\nflowchart TD\nA-->B\n```";
    await act(async () => {
      render(<MarkdownRenderer content={md} />);
    });

    expect(screen.getByTestId("mermaid-diagram")).toBeInTheDocument();
  });
});
