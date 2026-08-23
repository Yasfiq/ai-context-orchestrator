import { describe, expect, it } from "vitest";
import {
  cleanModelOutput,
  validateModelDocument,
} from "@/lib/llm-output";

const VALID_DOCUMENT = "## Overview\n\nA sufficiently detailed document body.".padEnd(
  240,
  " content"
);

describe("LLM output validation", () => {
  it("removes thinking tags and an outer Markdown fence", () => {
    const fence = "```";
    const output = `<think>internal</think>\n\n${fence}markdown\n${VALID_DOCUMENT}\n${fence}`;
    expect(cleanModelOutput(output)).toBe(VALID_DOCUMENT);
  });

  it("rejects output that exhausted its token budget", () => {
    expect(() => validateModelDocument(VALID_DOCUMENT, "length")).toThrow(
      "token limit"
    );
  });

  it("rejects leaked reasoning", () => {
    const output = `Here's a thinking process:\n\n${VALID_DOCUMENT}`;
    expect(() => validateModelDocument(output, "stop")).toThrow(
      "internal reasoning"
    );
  });

  it("rejects unclosed Markdown code fences", () => {
    const output = `${VALID_DOCUMENT}\n\n\`\`\`ts\nconst value = true;`;
    expect(() => validateModelDocument(output, "stop")).toThrow(
      "truncated Markdown"
    );
  });

  it("rejects unexpectedly destructive tweaks", () => {
    expect(() =>
      validateModelDocument(VALID_DOCUMENT, "stop", {
        previousLength: 10_000,
      })
    ).toThrow("unexpectedly shorter");
  });
});
