import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatBubble } from "@/components/features/ChatBubble";
import type { ChatMessage } from "@/types/schema";

describe("ChatBubble", () => {
  const baseTimestamp = 1700000000000;

  it("should render user message content", () => {
    const message: ChatMessage = {
      id: "msg-1",
      role: "user",
      content: "Hello, I want to build a todo app",
      timestamp: baseTimestamp,
    };
    render(<ChatBubble message={message} />);
    expect(screen.getByText("Hello, I want to build a todo app")).toBeTruthy();
  });

  it("should render assistant message with Context Architect label", () => {
    const message: ChatMessage = {
      id: "msg-2",
      role: "assistant",
      content: "Great! Tell me more about your project vision.",
      timestamp: baseTimestamp,
    };
    render(<ChatBubble message={message} />);
    expect(screen.getByText("Context Architect")).toBeTruthy();
    expect(
      screen.getByText("Great! Tell me more about your project vision.")
    ).toBeTruthy();
  });

  it("should render system message centered", () => {
    const message: ChatMessage = {
      id: "msg-3",
      role: "system",
      content: "Session started",
      timestamp: baseTimestamp,
    };
    render(<ChatBubble message={message} />);
    expect(screen.getByText("Session started")).toBeTruthy();
  });

  it("should not show Context Architect label for user messages", () => {
    const message: ChatMessage = {
      id: "msg-4",
      role: "user",
      content: "My project is about task management",
      timestamp: baseTimestamp,
    };
    render(<ChatBubble message={message} />);
    expect(screen.queryByText("Context Architect")).toBeNull();
  });

  it("should not show Context Architect label for system messages", () => {
    const message: ChatMessage = {
      id: "msg-5",
      role: "system",
      content: "System notification",
      timestamp: baseTimestamp,
    };
    render(<ChatBubble message={message} />);
    expect(screen.queryByText("Context Architect")).toBeNull();
  });

  it("should display formatted timestamp", () => {
    const message: ChatMessage = {
      id: "msg-6",
      role: "user",
      content: "Test message",
      timestamp: baseTimestamp,
    };
    render(<ChatBubble message={message} />);
    const timeElements = screen.getByText("Test message")
      .closest("div")
      ?.parentElement?.querySelectorAll("div");
    expect(timeElements).toBeTruthy();
  });

  it("should preserve whitespace in message content", () => {
    const message: ChatMessage = {
      id: "msg-7",
      role: "user",
      content: "Line 1\nLine 2\nLine 3",
      timestamp: baseTimestamp,
    };
    const { container } = render(<ChatBubble message={message} />);
    const contentDiv = container.querySelector(".whitespace-pre-wrap");
    expect(contentDiv?.textContent).toBe("Line 1\nLine 2\nLine 3");
  });

  it("should render assistant Markdown without showing raw markers", () => {
    const message: ChatMessage = {
      id: "msg-markdown",
      role: "assistant",
      content: "**Rekomendasi**\n\n- Opsi pertama\n- Opsi kedua",
      timestamp: baseTimestamp,
    };

    render(<ChatBubble message={message} />);

    expect(screen.getByText("Rekomendasi").tagName).toBe("STRONG");
    expect(screen.getByText("Opsi pertama").tagName).toBe("LI");
    expect(screen.queryByText("**Rekomendasi**")).toBeNull();
  });

  it("should keep Markdown-like user input literal", () => {
    const message: ChatMessage = {
      id: "msg-user-markdown",
      role: "user",
      content: "**Jangan format input ini**",
      timestamp: baseTimestamp,
    };

    render(<ChatBubble message={message} />);

    expect(screen.getByText("**Jangan format input ini**")).toBeTruthy();
  });

  it("should not turn raw assistant HTML into DOM elements", () => {
    const message: ChatMessage = {
      id: "msg-unsafe-html",
      role: "assistant",
      content: '<img src="x" onerror="alert(1)">',
      timestamp: baseTimestamp,
    };

    const { container } = render(<ChatBubble message={message} />);

    expect(container.querySelector("img")).toBeNull();
  });

  it("should render long messages without truncation", () => {
    const longContent = "A".repeat(500);
    const message: ChatMessage = {
      id: "msg-8",
      role: "user",
      content: longContent,
      timestamp: baseTimestamp,
    };
    render(<ChatBubble message={message} />);
    expect(screen.getByText(longContent)).toBeTruthy();
  });

  it("renders inline retry button when message is an error and triggers onRetry", () => {
    const onRetryMock = vi.fn();
    const errorMessage: ChatMessage = {
      id: "msg-err",
      role: "assistant",
      content: "Koneksi terputus. Silakan coba kembali.",
      timestamp: baseTimestamp,
      isError: true,
      failedContent: "Kebutuhan proyek saya adalah marketplace buku",
    };

    render(<ChatBubble message={errorMessage} onRetry={onRetryMock} />);

    expect(screen.getByText("Sistem / Kesalahan")).toBeTruthy();
    const retryBtn = screen.getByRole("button", { name: "Coba kirim ulang pesan ini" });
    expect(retryBtn).toBeTruthy();

    fireEvent.click(retryBtn);
    expect(onRetryMock).toHaveBeenCalledWith(
      "Kebutuhan proyek saya adalah marketplace buku",
      "msg-err"
    );
  });
});
