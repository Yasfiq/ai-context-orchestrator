import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Toast } from "@/components/ui/Toast";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render message when visible", () => {
    render(
      <Toast message="Success!" type="success" visible={true} onClose={vi.fn()} />
    );
    expect(screen.getByText("Success!")).toBeTruthy();
  });

  it("should NOT render when visible is false", () => {
    render(
      <Toast message="Hidden" type="info" visible={false} onClose={vi.fn()} />
    );
    expect(screen.queryByText("Hidden")).toBeNull();
  });

  it("should render with success styling", () => {
    const { container } = render(
      <Toast message="Done" type="success" visible={true} onClose={vi.fn()} />
    );
    const toast = container.querySelector("[role='status']");
    expect(toast?.className).toContain("border-success/50");
  });

  it("should render with error styling", () => {
    const { container } = render(
      <Toast message="Error!" type="error" visible={true} onClose={vi.fn()} />
    );
    const toast = container.querySelector("[role='alert']");
    expect(toast?.className).toContain("border-destructive/60");
  });

  it("should render with info styling", () => {
    const { container } = render(
      <Toast message="Info" type="info" visible={true} onClose={vi.fn()} />
    );
    const toast = container.querySelector("[role='status']");
    expect(toast?.className).toContain("border-primary/60");
  });

  it("should auto-close after 4 seconds", () => {
    const handleClose = vi.fn();
    render(
      <Toast message="Auto close" type="info" visible={true} onClose={handleClose} />
    );
    expect(handleClose).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("should NOT auto-close before 4 seconds", () => {
    const handleClose = vi.fn();
    render(
      <Toast message="Wait" type="info" visible={true} onClose={handleClose} />
    );
    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("should call onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <Toast message="Close me" type="info" visible={true} onClose={handleClose} />
    );
    fireEvent.click(screen.getByLabelText("Tutup notifikasi"));
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("should use a polite status role for non-error messages", () => {
    render(
      <Toast message="Accessible" type="info" visible={true} onClose={vi.fn()} />
    );
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("should default to info type when not specified", () => {
    const { container } = render(
      <Toast message="Default" visible={true} onClose={vi.fn()} />
    );
    const toast = container.querySelector("[role='status']");
    expect(toast?.className).toContain("border-primary/60");
  });
});
