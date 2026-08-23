import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MermaidDiagram } from "@/components/features/MermaidDiagram";
import { MarkdownRenderer } from "@/components/features/MarkdownRenderer";

const renderMermaidSvgMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/mermaid-client", () => ({
  renderMermaidSvg: renderMermaidSvgMock,
}));

describe("MermaidDiagram", () => {
  beforeEach(() => {
    renderMermaidSvgMock.mockReset();
  });

  it("renders an accessible SVG result", async () => {
    renderMermaidSvgMock.mockResolvedValue(
      '<svg data-testid="rendered-svg"><text>Diagram</text></svg>'
    );

    render(<MermaidDiagram source="flowchart TD\nA-->B" />);

    expect(screen.getByRole("status")).toHaveTextContent("Menyusun tampilan diagram");
    expect(await screen.findByRole("img", { name: "Diagram proyek dengan format flowchart" })).toBeTruthy();
    expect(screen.getByTestId("rendered-svg")).toBeTruthy();
  });

  it("isolates invalid syntax and exposes its source", async () => {
    renderMermaidSvgMock.mockRejectedValue(new Error("Invalid syntax"));

    render(<MermaidDiagram source="flowchart TD\ninvalid" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Diagram belum dapat ditampilkan"
    );
    fireEvent.click(screen.getByRole("button", { name: "Lihat kode" }));
    expect(screen.getByText(/flowchart TD/)).toBeTruthy();
  });

  it("uses distinct render IDs for multiple diagrams", async () => {
    renderMermaidSvgMock.mockResolvedValue("<svg></svg>");

    render(
      <>
        <MermaidDiagram source="flowchart TD\nA-->B" />
        <MermaidDiagram source="gitGraph\ncommit" />
      </>
    );

    await waitFor(() => expect(renderMermaidSvgMock).toHaveBeenCalledTimes(2));
    expect(renderMermaidSvgMock.mock.calls[0][0]).not.toBe(
      renderMermaidSvgMock.mock.calls[1][0]
    );
  });

  it.each([
    "flowchart TD\nA-->B",
    "flowchart LR\nA-->B",
    "graph TD\nA-->B",
    "sequenceDiagram\nAlice->>Bob: Hello",
    "gitGraph\ncommit",
  ])("renders a fenced document diagram: %s", async (source) => {
    renderMermaidSvgMock.mockResolvedValue("<svg></svg>");

    render(<MarkdownRenderer content={`\`\`\`mermaid\n${source}\n\`\`\``} />);

    await waitFor(() =>
      expect(renderMermaidSvgMock).toHaveBeenCalledWith(
        expect.stringMatching(/^mermaid-/),
        source
      )
    );
  });

  it("recovers a malformed Mermaid fence before rendering", async () => {
    renderMermaidSvgMock.mockResolvedValue("<svg></svg>");

    render(
      <MarkdownRenderer content={"```flowchart TD\nA-->B\n```"} />
    );

    await waitFor(() =>
      expect(renderMermaidSvgMock).toHaveBeenCalledWith(
        expect.stringMatching(/^mermaid-/),
        "flowchart TD\nA-->B"
      )
    );
  });

  it("ignores a stale render after the diagram source changes", async () => {
    let resolveFirst!: (svg: string) => void;
    let resolveSecond!: (svg: string) => void;
    renderMermaidSvgMock
      .mockImplementationOnce(
        () => new Promise<string>((resolve) => { resolveFirst = resolve; })
      )
      .mockImplementationOnce(
        () => new Promise<string>((resolve) => { resolveSecond = resolve; })
      );

    const { rerender } = render(
      <MermaidDiagram source="flowchart TD\nA-->B" />
    );
    rerender(<MermaidDiagram source="flowchart LR\nA-->B" />);

    resolveSecond('<svg data-testid="latest-svg"></svg>');
    expect(await screen.findByTestId("latest-svg")).toBeTruthy();

    resolveFirst('<svg data-testid="stale-svg"></svg>');
    await waitFor(() => expect(screen.queryByTestId("stale-svg")).toBeNull());
    expect(screen.getByTestId("latest-svg")).toBeTruthy();
  });
});
