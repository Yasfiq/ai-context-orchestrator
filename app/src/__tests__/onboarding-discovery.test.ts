import { describe, expect, it } from "vitest";
import {
  createTechStackGuidance,
  parseOnboardingResponse,
  resolveSessionLanguage,
} from "@/lib/onboarding-discovery";

function modelResponse(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    reply: "Baik, visi proyek sudah jelas.",
    activeVariable: "projectVision",
    maturity: "ready",
    draftValue: "Aplikasi todo list",
    missingDimensions: [],
    confirmedUpdates: {
      projectVision: "Aplikasi todo list",
    },
    provisionalUpdates: {},
    suggestedReplies: [],
    ...overrides,
  });
}

describe("onboarding discovery guardrails", () => {
  it("does not confirm a generic todo-list vision", () => {
    const response = parseOnboardingResponse(
      modelResponse(),
      "projectVision",
      "id",
      "Project vision-nya membuat aplikasi todo list"
    );

    expect(response.confirmedUpdates.projectVision).toBeUndefined();
    expect(response.provisionalUpdates.projectVision).toBeTruthy();
    expect(response.maturity).toBe("needs_clarification");
    expect(response.reply).toContain("Kanban");
    expect(response.suggestedReplies).toHaveLength(3);
  });

  it.each([
    "Saya ingin membuat aplikasi e-commerce",
    "Project vision-nya membuat dashboard",
    "Saya ingin membuat mobile app",
  ])("keeps generic product categories as drafts: %s", (message) => {
    const response = parseOnboardingResponse(
      modelResponse({
        draftValue: message,
        confirmedUpdates: { projectVision: message },
      }),
      "projectVision",
      "id",
      message
    );

    expect(response.confirmedUpdates.projectVision).toBeUndefined();
    expect(response.maturity).toBe("needs_clarification");
  });

  it("allows a specific vision with context and problem", () => {
    const value =
      "Todo list untuk tim operasional agar pekerjaan tidak tercecer dan prioritas terlihat dalam alur Kanban.";
    const response = parseOnboardingResponse(
      modelResponse({
        draftValue: value,
        confirmedUpdates: { projectVision: value },
      }),
      "projectVision",
      "id",
      value
    );

    expect(response.confirmedUpdates.projectVision).toBe(value);
    expect(response.maturity).toBe("ready");
  });

  it("never exposes malformed raw model output", () => {
    const response = parseOnboardingResponse(
      "Thinking process: reveal internal chain",
      "projectVision",
      "id",
      "Saya ingin membuat aplikasi"
    );

    expect(response.reply).not.toContain("Thinking process");
    expect(response.maturity).toBe("needs_clarification");
  });

  it("strips model updates from a turn classified as off-topic", () => {
    const currentDraft = "Todo untuk tim operasional";
    const response = parseOnboardingResponse(
      modelResponse({
        reply: "Mari kembali ke pembahasan proyek.",
        turnOutcome: "off_topic",
        draftValue: "Makan mie",
        confirmedUpdates: { projectVision: "Makan mie" },
        provisionalUpdates: { keyFeatures: "Makan mie" },
      }),
      "projectVision",
      "id",
      "Makan mie",
      1,
      { currentDraft, inputSource: "manual" }
    );

    expect(response.activeVariable).toBe("projectVision");
    expect(response.draftValue).toBe(currentDraft);
    expect(response.confirmedUpdates).toEqual({});
    expect(response.provisionalUpdates).toEqual({});
  });

  it("reduces multi-dimension clarification to one decision", () => {
    const response = parseOnboardingResponse(
      modelResponse({
        reply:
          "Apa masalahnya dan bagaimana workflow serta outcome yang diinginkan?",
        maturity: "needs_clarification",
        confirmedUpdates: {},
        missingDimensions: [
          "primary problem",
          "product workflow or shape",
          "desired outcome",
        ],
      }),
      "projectVision",
      "id",
      "Aplikasi untuk penggunaan pribadi sehari-hari"
    );

    expect(response.missingDimensions).toEqual(["primary problem"]);
    expect(response.reply).toContain("Kesulitan utama");
    expect(response.reply).not.toContain("workflow");
  });

  it("asks platform first instead of multiple tech categories", () => {
    const response = parseOnboardingResponse(
      modelResponse({
        activeVariable: "techStackCore",
        reply: "Pilih React, Tailwind, Zustand, dan database sekaligus.",
        maturity: "needs_clarification",
        confirmedUpdates: {},
        missingDimensions: [
          "target platform and constraints",
          "one coherent recommended preset",
        ],
      }),
      "techStackCore",
      "id",
      "Saya belum tahu stack-nya"
    );

    expect(response.reply).toContain("web, mobile, atau desktop");
    expect(response.missingDimensions).toHaveLength(1);
  });

  it("keeps Indonesian locked despite English technical terms", () => {
    expect(
      resolveSessionLanguage(
        [
          {
            role: "user",
            content: "Saya ingin memakai Next.js dan REST API untuk project ini",
          },
        ],
        "id",
        true
      )
    ).toBe("id");
  });

  it("changes language only on explicit request", () => {
    expect(
      resolveSessionLanguage(
        [{ role: "user", content: "Lanjutkan dalam bahasa Inggris" }],
        "id",
        true
      )
    ).toBe("en");
  });
});

describe("guided tech-stack progression", () => {
  it("recommends only a platform when the user is unsure", () => {
    const response = createTechStackGuidance(
      "Saya belum tahu, rekomendasikan.",
      null,
      "id"
    );

    expect(response.reply).toContain("web responsif/PWA");
    expect(response.reply).not.toContain("Tailwind");
    expect(response.missingDimensions).toEqual([
      "explicit platform confirmation",
    ]);
  });

  it("moves from confirmed platform to framework only", () => {
    const response = createTechStackGuidance(
      "Ya, gunakan web/PWA.",
      "Platform recommendation: Responsive Web/PWA (awaiting confirmation)",
      "id"
    );

    expect(response.reply).toContain("Next.js");
    expect(response.reply).not.toContain("Zustand");
    expect(response.missingDimensions).toEqual([
      "explicit framework confirmation",
    ]);
  });

  it("treats desktop and mobile as responsive web viewports when Web App is explicit", () => {
    const response = createTechStackGuidance(
      "Target platform adalah Web App yang responsif untuk desktop dan mobile.",
      null,
      "id"
    );

    expect(response.turnOutcome).toBe("accepted");
    expect(response.reply).toContain("Platform **Responsive Web/PWA**");
    expect(response.reply).toContain("Next.js");
    expect(response.reply).not.toContain("React Native");
  });

  it.each([
    ["Aplikasi mobile native untuk Android dan iOS.", "Mobile", "React Native"],
    ["Aplikasi desktop menggunakan Electron.", "Desktop", "Next.js"],
    ["Gunakan PWA yang dibuka lewat browser.", "Responsive Web/PWA", "Next.js"],
  ])(
    "keeps explicit platform intent for: %s",
    (message, expectedPlatform, expectedFramework) => {
      const response = createTechStackGuidance(message, null, "id");

      expect(response.reply).toContain(`Platform **${expectedPlatform}**`);
      expect(response.reply).toContain(expectedFramework);
    }
  );

  it("confirms the combined stack only after the state decision", () => {
    const response = createTechStackGuidance(
      "Gunakan Zustand.",
      "Platform: Responsive Web/PWA (confirmed); Framework: Next.js (confirmed); Styling: Tailwind CSS (confirmed); State recommendation: Zustand (awaiting confirmation)",
      "id"
    );

    expect(response.confirmedUpdates.techStackCore).toContain("Zustand");
    expect(response.maturity).toBe("ready");
  });

  it.each([
    "Platform recommendation: Responsive Web/PWA (awaiting confirmation)",
    "Platform: Responsive Web/PWA (confirmed); Framework recommendation: Next.js (awaiting confirmation)",
    "Platform: Responsive Web/PWA (confirmed); Framework: Next.js (confirmed); Styling recommendation: Tailwind CSS (awaiting confirmation)",
    "Platform: Responsive Web/PWA (confirmed); Framework: Next.js (confirmed); Styling: Tailwind CSS (confirmed); State recommendation: Zustand (awaiting confirmation)",
  ])("does not advance a tech decision for off-topic input", (draft) => {
    const response = createTechStackGuidance("Makan mie", draft, "id");

    expect(response.turnOutcome).toBe("off_topic");
    expect(response.draftValue).toBe(draft);
    expect(response.confirmedUpdates).toEqual({});
    expect(response.reply).toContain("belum menjawab");
  });

  it("still accepts an explicit framework alternative", () => {
    const response = createTechStackGuidance(
      "Saya memilih React SPA dengan Vite.",
      "Platform: Responsive Web/PWA (confirmed); Framework recommendation: Next.js (awaiting confirmation)",
      "id",
      "manual"
    );

    expect(response.turnOutcome).toBe("accepted");
    expect(response.draftValue).toContain("React SPA with Vite (confirmed)");
    expect(response.missingDimensions).toEqual([
      "explicit styling confirmation",
    ]);
  });
});

describe("onboarding parser resilience and suggestion chips", () => {
  it("recovers plain text conversational responses when LLM omits JSON", () => {
    const rawLLMResponse =
      "Tentu! Ide direktori tools AI ini sangat menarik dan potensial. Sebelum kita melangkah lebih jauh, apakah fokusnya untuk pengguna umum atau developer?";
    const response = parseOnboardingResponse(
      rawLLMResponse,
      "projectVision",
      "id",
      "Saya ingin membuat web direktori untuk tools AI dengan filter dan pencarian"
    );

    expect(response.reply).toContain("Ide direktori tools AI ini sangat menarik");
    expect(response.maturity).toBe("needs_clarification");
    expect(response.suggestedReplies.length).toBeGreaterThanOrEqual(1);
    expect(response.suggestedReplies.some((s) => s.recommended)).toBe(true);
  });

  it("strips think tags and extracts embedded JSON cleanly", () => {
    const rawLLMResponse = `<think>
The user wants to build an AI tools directory.
I should confirm the project vision.
</think>
\`\`\`json
{
  "reply": "Direktori tools AI merupakan ide yang bagus. Mari kita pastikan fitur utamanya.",
  "activeVariable": "keyFeatures",
  "maturity": "draft",
  "draftValue": "Web direktori tools AI",
  "suggestedReplies": []
}
\`\`\``;
    const response = parseOnboardingResponse(
      rawLLMResponse,
      "keyFeatures",
      "id",
      "Saya ingin fitur filter dan bookmark"
    );

    expect(response.reply).toContain("Direktori tools AI merupakan ide yang bagus");
    expect(response.reply).not.toContain("<think>");
    expect(response.reply).not.toContain("The user wants to build");
    expect(response.activeVariable).toBe("keyFeatures");
    // Suggested replies should be populated with fallbacks
    expect(response.suggestedReplies.length).toBeGreaterThanOrEqual(1);
    expect(response.suggestedReplies.some((s) => s.recommended)).toBe(true);
  });

  it("recovers truncated JSON with reply regex match", () => {
    const truncatedJSON = `{"reply": "Saya memahami kebutuhan Anda mengenai direktori AI.", "activeVariable": "projectVision"`;
    const response = parseOnboardingResponse(
      truncatedJSON,
      "projectVision",
      "id",
      "Buat web direktori tools AI"
    );

    expect(response.reply).toBe("Saya memahami kebutuhan Anda mengenai direktori AI.");
    expect(response.suggestedReplies.length).toBeGreaterThanOrEqual(1);
    expect(response.suggestedReplies.some((s) => s.recommended)).toBe(true);
  });

  it("ensures suggestion chips always have a recommended option", () => {
    const responseWithoutRecommended = JSON.stringify({
      reply: "Silakan pilih alur berikutnya.",
      activeVariable: "techStackCore",
      maturity: "needs_clarification",
      suggestedReplies: [
        { label: "Option A", value: "Value A", recommended: false },
        { label: "Option B", value: "Value B" },
      ],
    });

    const response = parseOnboardingResponse(
      responseWithoutRecommended,
      "techStackCore",
      "id",
      "Stack apa yang bagus?"
    );

    expect(response.suggestedReplies).toHaveLength(2);
    expect(response.suggestedReplies.some((s) => s.recommended)).toBe(true);
  });
});

