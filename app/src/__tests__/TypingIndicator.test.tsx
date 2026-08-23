import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TypingIndicator } from "@/components/features/TypingIndicator";

describe("TypingIndicator", () => {
  it("should explain the active task", () => {
    render(<TypingIndicator />);
    expect(screen.getByText("Memeriksa kelengkapan jawaban...")).toBeTruthy();
  });

  it("should expose a polite status region", () => {
    render(<TypingIndicator />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("should not use generic bouncing dots", () => {
    const { container } = render(<TypingIndicator />);
    expect(container.querySelectorAll(".animate-pulse-dot")).toHaveLength(0);
  });

  it("should include a non-verbal status icon", () => {
    const { container } = render(<TypingIndicator />);
    expect(container.querySelector("svg[aria-hidden='true']")).toBeTruthy();
  });
});
