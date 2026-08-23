import { describe, it, expect } from "vitest";
import { parseAIJsonResponse } from "@/lib/parse-ai-json-response";

describe("parseAIJsonResponse", () => {
  it("should parse standard clean JSON", () => {
    const input = JSON.stringify({
      reply: "Halo! Ceritakan visi proyek Anda.",
      extractedVariables: { projectVision: "Todo List" },
    });
    const result = parseAIJsonResponse(input);
    expect(result.reply).toBe("Halo! Ceritakan visi proyek Anda.");
    expect(result.extractedVariables.projectVision).toBe("Todo List");
  });

  it("should parse JSON wrapped in markdown code blocks", () => {
    const input = `\`\`\`json
{
  "reply": "Sip, bagaimana dengan target pengguna?",
  "extractedVariables": { "userRolesPermissions": "Admin, User" }
}
\`\`\``;
    const result = parseAIJsonResponse(input);
    expect(result.reply).toBe("Sip, bagaimana dengan target pengguna?");
    expect(result.extractedVariables.userRolesPermissions).toBe("Admin, User");
  });

  it("should extract JSON even when preceded by reasoning / thinking text (the reported bug)", () => {
    const input = `The user provided their project vision: "Aplikasi Todo List".
Now they're adding more details about their pain points.
I should respond by acknowledging their vision, then ask about User Roles & Permissions.

\`\`\`json
{
  "reply": "Wah, Todo List aplikasi yang bagus! Siapa saja yang akan menggunakan aplikasi ini?",
  "extractedVariables": {
    "projectVision": "Aplikasi Todo List"
  }
}
\`\`\``;
    const result = parseAIJsonResponse(input);
    expect(result.reply).toBe(
      "Wah, Todo List aplikasi yang bagus! Siapa saja yang akan menggunakan aplikasi ini?"
    );
    expect(result.extractedVariables.projectVision).toBe("Aplikasi Todo List");
    // Ensure reasoning text is NOT in reply
    expect(result.reply).not.toContain("The user provided");
    expect(result.reply).not.toContain("I should respond");
  });

  it("should handle <think> tags correctly (DeepSeek R1 format)", () => {
    const input = `<think>
The user wants a todo list app.
Next variable to ask is user roles.
</think>
\`\`\`json
{
  "reply": "Siapa saja target pengguna aplikasi ini?",
  "extractedVariables": {}
}
\`\`\``;
    const result = parseAIJsonResponse(input);
    expect(result.reply).toBe("Siapa saja target pengguna aplikasi ini?");
    expect(result.reply).not.toContain("<think>");
  });

  it("should handle raw JSON with trailing text after JSON block", () => {
    const input = `Thinking process...
{
  "reply": "Pertanyaan berikutnya: apa saja fitur intinya?",
  "extractedVariables": { "keyFeatures": "CRUD, Deadline" }
}
Hope this helps the user!`;
    const result = parseAIJsonResponse(input);
    expect(result.reply).toBe("Pertanyaan berikutnya: apa saja fitur intinya?");
    expect(result.extractedVariables.keyFeatures).toBe("CRUD, Deadline");
  });
});
