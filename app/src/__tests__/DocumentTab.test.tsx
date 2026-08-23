import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DocumentTab } from "@/components/features/DocumentTab";

describe("DocumentTab", () => {
  it("should render document label text", () => {
    render(
      <DocumentTab docName="PRD" isActive={false} onClick={vi.fn()} />
    );
    expect(screen.getByText("Product Requirements Document")).toBeTruthy();
  });

  it("should render ARCHITECTURE label correctly", () => {
    render(
      <DocumentTab docName="ARCHITECTURE" isActive={false} onClick={vi.fn()} />
    );
    expect(screen.getByText("Architecture")).toBeTruthy();
  });

  it("should render AGENTS label correctly", () => {
    render(
      <DocumentTab docName="AGENTS" isActive={false} onClick={vi.fn()} />
    );
    expect(screen.getByText("AI Agents")).toBeTruthy();
  });

  it("should render WORKFLOW label correctly", () => {
    render(
      <DocumentTab docName="WORKFLOW" isActive={false} onClick={vi.fn()} />
    );
    expect(screen.getByText("Workflow")).toBeTruthy();
  });

  it("should render SKILLS_MATRIX label correctly", () => {
    render(
      <DocumentTab docName="SKILLS_MATRIX" isActive={false} onClick={vi.fn()} />
    );
    expect(screen.getByText("Skills Matrix")).toBeTruthy();
  });

  it("should render IMPLEMENTATION_PLAN label correctly", () => {
    render(
      <DocumentTab docName="IMPLEMENTATION_PLAN" isActive={false} onClick={vi.fn()} />
    );
    expect(screen.getByText("Implementation Plan")).toBeTruthy();
  });

  it("should apply active styling when isActive is true", () => {
    const { container } = render(
      <DocumentTab docName="PRD" isActive={true} onClick={vi.fn()} />
    );
    const button = container.querySelector("button");
    expect(button?.getAttribute("aria-selected")).toBe("true");
    expect(button?.getAttribute("tabindex")).toBe("0");
  });

  it("should apply inactive styling when isActive is false", () => {
    const { container } = render(
      <DocumentTab docName="PRD" isActive={false} onClick={vi.fn()} />
    );
    const button = container.querySelector("button");
    expect(button?.getAttribute("aria-selected")).toBe("false");
    expect(button?.getAttribute("tabindex")).toBe("-1");
  });

  it("should call onClick when clicked", () => {
    const handleClick = vi.fn();
    render(
      <DocumentTab docName="PRD" isActive={false} onClick={handleClick} />
    );
    fireEvent.click(screen.getByText("Product Requirements Document"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("should call onClick even when already active", () => {
    const handleClick = vi.fn();
    render(
      <DocumentTab docName="RULES" isActive={true} onClick={handleClick} />
    );
    fireEvent.click(screen.getByText("Rules & Conventions"));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
