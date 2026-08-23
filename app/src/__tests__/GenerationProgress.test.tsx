import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GenerationProgress } from "@/components/features/GenerationProgress";
import { useAppStore } from "@/store/use-app-store";
import { COP_GENERATION_ORDER } from "@/types/schema";

describe("GenerationProgress", () => {
  beforeEach(() => {
    useAppStore.getState().resetAll();
    const store = useAppStore.getState();
    store.updateMustHave("projectVision", "Confirmed vision");
    store.updateMustHave("userRolesPermissions", "Confirmed roles");
    store.updateMustHave("keyFeatures", "Confirmed features");
    store.updateMustHave("techStackCore", "Confirmed stack");
    store.updateMustHave("dataFlowIntegration", "Confirmed data flow");
    store.updateMustHave("qaAndTesting", "Confirmed QA");
    store.updateMustHave("securityCompliance", "Confirmed security");
    store.updateMustHave("teamPersonas", "Confirmed personas");
  });

  it("generates each document once and keeps progress monotonic", async () => {
    const fetchMock = vi.fn((_url: string, options?: RequestInit) => {
      const payload = JSON.parse(String(options?.body));
      return new Promise<Response>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          resolve(
            new Response(
              JSON.stringify({
                name: payload.documentName,
                content: `## ${payload.documentName}\n\nGenerated content`,
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        }, 1);

        options?.signal?.addEventListener(
          "abort",
          () => {
            window.clearTimeout(timer);
            reject(new DOMException("The operation was aborted", "AbortError"));
          },
          { once: true }
        );
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <React.StrictMode>
        <GenerationProgress />
      </React.StrictMode>
    );

    await waitFor(() => {
      expect(useAppStore.getState().documents).toHaveLength(7);
    });

    expect(fetchMock).toHaveBeenCalledTimes(7);
    expect(screen.queryByText("Generation Error")).toBeNull();
    expect(
      COP_GENERATION_ORDER.map(
        (name) => useAppStore.getState().documentProgress[name]
      )
    ).toEqual(Array(7).fill("completed"));
    expect(
      fetchMock.mock.calls.map((call) => {
        const options = call[1] as RequestInit;
        return JSON.parse(String(options.body)).documentName;
      })
    ).toEqual(COP_GENERATION_ORDER);

    vi.unstubAllGlobals();
  });
});
