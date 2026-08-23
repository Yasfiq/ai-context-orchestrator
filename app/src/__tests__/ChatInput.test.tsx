import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatInput } from "@/components/features/ChatInput";

describe("ChatInput", () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("should render textarea with placeholder", () => {
    render(<ChatInput onSubmit={mockOnSubmit} placeholder="Type here..." />);
    expect(screen.getByPlaceholderText("Type here...")).toBeTruthy();
  });

  it("should render default placeholder when none provided", () => {
    render(<ChatInput onSubmit={mockOnSubmit} />);
    expect(screen.getByPlaceholderText("Tulis jawaban Anda...")).toBeTruthy();
  });

  it("should render send button", () => {
    render(<ChatInput onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText("Kirim jawaban")).toBeTruthy();
  });

  it("should disable send button when input is empty", () => {
    render(<ChatInput onSubmit={mockOnSubmit} />);
    const button = screen.getByLabelText("Kirim jawaban");
    expect(button).toBeDisabled();
  });

  it("should call onSubmit with trimmed value on form submit", async () => {
    render(<ChatInput onSubmit={mockOnSubmit} />);
    const textarea = screen.getByPlaceholderText("Tulis jawaban Anda...");
    fireEvent.change(textarea, { target: { value: "  Hello world  " } });
    fireEvent.submit(textarea.closest("form")!);
    expect(mockOnSubmit).toHaveBeenCalledWith("Hello world");
  });

  it("should clear textarea after successful submit", () => {
    render(<ChatInput onSubmit={mockOnSubmit} />);
    const textarea = screen.getByPlaceholderText("Tulis jawaban Anda...") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Test message" } });
    fireEvent.submit(textarea.closest("form")!);
    expect(textarea.value).toBe("");
  });

  it("should NOT submit when input is only whitespace", () => {
    render(<ChatInput onSubmit={mockOnSubmit} />);
    const textarea = screen.getByPlaceholderText("Tulis jawaban Anda...");
    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.submit(textarea.closest("form")!);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should submit on Enter key press", () => {
    render(<ChatInput onSubmit={mockOnSubmit} />);
    const textarea = screen.getByPlaceholderText("Tulis jawaban Anda...");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(mockOnSubmit).toHaveBeenCalledWith("Hello");
  });

  it("should NOT submit on Shift+Enter (allows newline)", () => {
    render(<ChatInput onSubmit={mockOnSubmit} />);
    const textarea = screen.getByPlaceholderText("Tulis jawaban Anda...");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should disable textarea and button when disabled prop is true", () => {
    render(<ChatInput onSubmit={mockOnSubmit} disabled={true} />);
    const textarea = screen.getByPlaceholderText("Tulis jawaban Anda...");
    const button = screen.getByLabelText("Kirim jawaban");
    expect(textarea).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it("should NOT submit when disabled even with content", () => {
    render(<ChatInput onSubmit={mockOnSubmit} disabled={true} />);
    const textarea = screen.getByPlaceholderText("Tulis jawaban Anda...");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
