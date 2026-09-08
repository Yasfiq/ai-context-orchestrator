import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResultsView } from "@/components/features/ResultsView";
import { useAppStore } from "@/store/use-app-store";
import type { GeneratedDocument } from "@/types/schema";

const documents: GeneratedDocument[] = [
  {
    name: "PRD",
    filename: "PRD.md",
    content: "## PRD\n\n" + "Long content.\n\n".repeat(30),
    generatedAt: 1700000000000,
  },
  {
    name: "ARCHITECTURE",
    filename: "ARCHITECTURE.md",
    content: "## Architecture\n\nArchitecture content.",
    generatedAt: 1700000000000,
  },
];

describe("ResultsView document scrolling", () => {
  beforeEach(() => {
    act(() => {
      useAppStore.getState().resetAll();
      useAppStore.getState().setDocuments(documents);
      useAppStore.getState().setActiveDocumentTab("PRD");
    });
  });

  it("resets document scroll when the active tab changes", () => {
    render(<ResultsView />);
    const scrollArea = screen.getByTestId("document-scroll-area");
    expect(scrollArea.className).toContain("[overflow-anchor:none]");
    scrollArea.scrollTop = 480;

    fireEvent.click(screen.getByRole("tab", { name: /Architecture/ }));

    expect(scrollArea.scrollTop).toBe(0);
  });

  it("does not reset scroll when the active document content changes", () => {
    render(<ResultsView />);
    const scrollArea = screen.getByTestId("document-scroll-area");
    scrollArea.scrollTop = 320;

    act(() => {
      useAppStore.getState().updateDocument("PRD", "## Updated PRD");
    });

    expect(scrollArea.scrollTop).toBe(320);
  });

  it("copies active document content to clipboard when Salin button is clicked", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

    render(<ResultsView />);
    const copyButton = screen.getByRole("button", { name: /Salin dokumen Product Requirements Document/ });
    expect(copyButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(writeTextMock).toHaveBeenCalledWith(documents[0].content);
    expect(screen.getByText("Tersalin")).toBeInTheDocument();
  });
});
