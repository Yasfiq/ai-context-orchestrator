/**
 * Helper to fetch the /api/chat endpoint which uses streamText (SSE format).
 * Parses the data: ... chunks and extracts the final reply + extracted variables.
 */
export async function fetchChatStream(
  messages: Array<{ role: string; content: string }>,
  mustHaves: Record<string, string | null>
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages, mustHaves }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error: ${response.status} - ${errText}`);
    }

    // Chat route returns OnboardingApiResponse as JSON (not streaming)
    const json = await response.json() as {
      reply: string;
      confirmedUpdates?: Record<string, string>;
      provisionalUpdates?: Record<string, string>;
    };

    // Map confirmedUpdates + provisionalUpdates to extractedVariables format
    const extractedVariables: Record<string, string | null> = {};
    if (json.confirmedUpdates) {
      Object.assign(extractedVariables, json.confirmedUpdates);
    }
    if (json.provisionalUpdates) {
      Object.assign(extractedVariables, json.provisionalUpdates);
    }


    return {
      reply: json.reply || "Maaf, AI tidak memberikan respons terbaca.",
      extractedVariables,
    };
  } catch (error) {
    console.error("[fetchChatStream] Error:", error);
    return {
      reply: "Respons AI belum dapat diterima. Silakan kirim kembali jawaban terakhir.",
      extractedVariables: {},
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
