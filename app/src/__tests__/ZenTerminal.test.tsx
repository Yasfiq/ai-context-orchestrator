import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZenTerminal } from "@/components/features/ZenTerminal";
import { useAppStore } from "@/store/use-app-store";

describe("ZenTerminal suggestion provenance", () => {
  beforeEach(() => {
    useAppStore.getState().resetAll();
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({
          reply: "Lanjut.",
          activeVariable: "projectVision",
          maturity: "needs_clarification",
          draftValue: null,
          draftSource: "user",
          missingDimensions: ["primary problem"],
          confirmedUpdates: {},
          provisionalUpdates: {},
          suggestedReplies: [],
          sessionLanguage: "id",
          turnOutcome: "ambiguous",
        }),
      })
    );
  });

  it("marks recommendation provenance only for the request created by its chip", async () => {
    useAppStore.getState().applyOnboardingResponse({
      reply: "Pilih konteks.",
      activeVariable: "projectVision",
      maturity: "needs_clarification",
      draftValue: "Todo list",
      draftSource: "ai",
      missingDimensions: ["usage context"],
      confirmedUpdates: {},
      provisionalUpdates: {},
      suggestedReplies: [
        {
          label: "Pribadi harian",
          value: "Untuk penggunaan pribadi sehari-hari.",
          recommended: true,
        },
      ],
      sessionLanguage: "id",
    });

    render(<ZenTerminal />);
    fireEvent.click(
      screen.getByRole("button", { name: /Rekomendasi:.*Pribadi harian/ })
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const request = vi.mocked(fetch).mock.calls[0][1];
    const body = JSON.parse(String(request?.body));
    expect(body.inputSource).toBe("suggestion");
    expect(body.selectedRecommendation).toBe(true);
  });

  it("sends a later typed answer as manual input", async () => {
    render(<ZenTerminal />);
    const textarea = screen.getByPlaceholderText(
      "Ceritakan proyek Anda..."
    );
    fireEvent.change(textarea, { target: { value: "Makan mie" } });
    fireEvent.submit(textarea.closest("form")!);

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const request = vi.mocked(fetch).mock.calls[0][1];
    const body = JSON.parse(String(request?.body));
    expect(body.inputSource).toBe("manual");
    expect(body.selectedRecommendation).toBe(false);
  });
});
