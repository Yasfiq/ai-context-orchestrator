import type { SessionLanguage } from "@/types/schema";

export function resolveSessionLanguage(
  messages: Array<{ role: string; content: string }>,
  currentLanguage: SessionLanguage,
  locked: boolean
): SessionLanguage {
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  const content = lastUser?.content || "";

  if (
    /(?:gunakan|lanjutkan|ganti ke)\s+(?:dalam\s+)?bahasa\s+inggris|(?:switch|continue)\s+(?:to|in)\s+english/i.test(
      content
    )
  ) {
    return "en";
  }
  if (
    /(?:gunakan|lanjutkan|ganti ke)\s+(?:dalam\s+)?bahasa\s+indonesia|(?:switch|continue)\s+(?:to|in)\s+indonesian/i.test(
      content
    )
  ) {
    return "id";
  }
  if (locked) return currentLanguage;

  const userText = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join(" ");
  const idScore =
    userText.match(
      /\b(saya|ingin|buat|untuk|dengan|aplikasi|proyek|pengguna|fitur|yang|dan|atau|tidak|bisa)\b/gi
    )?.length || 0;
  return idScore > 0 ? "id" : "en";
}
