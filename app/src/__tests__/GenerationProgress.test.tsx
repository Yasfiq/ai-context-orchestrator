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
      expect(useAppStore.getState().documents).toHaveLength(3);
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(screen.queryByText("Generation Error")).toBeNull();
    expect(
      COP_GENERATION_ORDER.map(
        (name) => useAppStore.getState().documentProgress[name]
      )
    ).toEqual(Array(3).fill("completed"));
    expect(
      fetchMock.mock.calls.map((call) => {
        const options = call[1] as RequestInit;
        return JSON.parse(String(options.body)).documentName;
      })
    ).toEqual(COP_GENERATION_ORDER);

    vi.unstubAllGlobals();
  });

  it("automatically retries once on transient failure and recovers seamlessly", async () => {
    let callCount = 0;
    const fetchMock = vi.fn((_url: string, options?: RequestInit) => {
      callCount++;
      const payload = JSON.parse(String(options?.body));

      // Simulate a network failure on the first attempt of PRD
      if (callCount === 1) {
        return Promise.reject(new Error("Network connection dropped"));
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            name: payload.documentName,
            content: `## ${payload.documentName}\n\nRecovered content`,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<GenerationProgress />);

    await waitFor(() => {
      expect(useAppStore.getState().documents).toHaveLength(3);
    }, { timeout: 4000 });

    // 1 failed + 3 successful attempts = 4 total fetch calls
    expect(callCount).toBe(4);
    expect(screen.queryByText("Penyusunan dokumen terhenti")).toBeNull();

    vi.unstubAllGlobals();
  });

  it("displays smart resume button targeting the failed document when retry limit is reached", async () => {
    const fetchMock = vi.fn((_url: string, options?: RequestInit) => {
      const payload = JSON.parse(String(options?.body));
      if (payload.documentName === "ARCHITECTURE") {
        return Promise.reject(new Error("Persistent service outage"));
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            name: payload.documentName,
            content: `## ${payload.documentName}\n\nContent`,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<GenerationProgress />);

    await waitFor(() => {
      expect(screen.getByText("Penyusunan dokumen terhenti")).toBeInTheDocument();
    }, { timeout: 4000 });

    // PRD is completed, ARCHITECTURE failed
    expect(screen.getByText(/Lanjutkan penyusunan dari Architecture/i)).toBeInTheDocument();
    expect(screen.getByText(/1 dari 3 dokumen telah aman tersimpan/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("streams SSE chunks in real time, displays live preview, and completes document generation", async () => {
    const encoder = new TextEncoder();
    const fetchMock = vi.fn((_url: string, options?: RequestInit) => {
      const payload = JSON.parse(String(options?.body));
      const docName = payload.documentName;

      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "start", name: docName })}\n\n`)
          );
          await new Promise((r) => setTimeout(r, 10));
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "chunk", text: `Drafting ${docName} section 1. ` })}\n\n`)
          );
          await new Promise((r) => setTimeout(r, 10));
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "chunk", text: `Drafting ${docName} section 2.` })}\n\n`)
          );
          await new Promise((r) => setTimeout(r, 10));
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                name: docName,
                content: `## ${docName}\n\nCompleted stream content for ${docName}`,
              })}\n\n`
            )
          );
          controller.close();
        },
      });

      return Promise.resolve(
        new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
          },
        })
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<GenerationProgress />);

    // Check that live streaming preview appears while generating
    await waitFor(() => {
      expect(screen.getByTestId("streaming-preview-container")).toBeInTheDocument();
    });

    // Wait until all 3 documents complete
    await waitFor(
      () => {
        expect(useAppStore.getState().documents).toHaveLength(3);
      },
      { timeout: 5000 }
    );

    expect(
      useAppStore.getState().documents.map((d) => d.content)
    ).toEqual([
      "## PRD\n\nCompleted stream content for PRD",
      "## ARCHITECTURE\n\nCompleted stream content for ARCHITECTURE",
      "## AGENTS\n\nCompleted stream content for AGENTS",
    ]);

    vi.unstubAllGlobals();
  });

  it("handles SSE error event gracefully and shows retry button", async () => {
    const encoder = new TextEncoder();
    const fetchMock = vi.fn((_url: string, options?: RequestInit) => {
      const payload = JSON.parse(String(options?.body));
      const docName = payload.documentName;

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "start", name: docName })}\n\n`)
          );
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: "LLM streaming failed." })}\n\n`)
          );
          controller.close();
        },
      });

      return Promise.resolve(
        new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        })
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<GenerationProgress />);

    await waitFor(
      () => {
        expect(screen.getByText("Penyusunan dokumen terhenti")).toBeInTheDocument();
      },
      { timeout: 4000 }
    );

    expect(
      screen.getByText(/Dokumen belum dapat disusun/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Lanjutkan penyusunan dari Product Requirements Document/i)
    ).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
