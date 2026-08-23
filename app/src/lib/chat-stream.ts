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
        // Accept: "text/event-stream", // Not strictly required if we parse body manually
      },
      body: JSON.stringify({ messages, mustHaves }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error: ${response.status} - ${errText}`);
    }

    // Read the stream as text line by line
    const text = await response.text();
    const lines = text.split('\n');

    let fullReply = "";
    let extractedVarsRaw: Record<string, string> = {};

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const payloadStr = line.slice("data: ".length).trim();
        if (!payloadStr || payloadStr === "[DONE]") continue;

        try {
          const payload = JSON.parse(payloadStr);
          // Accumulate reply delta
          if (payload.type === "document" || payload.reply) {
            // If it's a final document object, we might have it all, but usually
            // the SDK streams deltas. We'll just concatenate 'reply' if present.
            if (payload.reply) fullReply += payload.reply;
          }
          // Extract variables from the payload if present
          if (payload.extractedVariables) {
            Object.assign(extractedVarsRaw, payload.extractedVarsRaw);
          }
        } catch {
          // Skip malformed JSON lines in the stream
        }
      }
    }

    // The AI SDK's streamText usually sends the final text in the last chunk
    // or we accumulate it. If fullReply is empty, maybe the whole response was one JSON blob?
    // Fallback: try to parse the whole text as JSON if no stream chunks looked like JSON.
    if (!fullReply) {
      try {
        const parsed = JSON.parse(fullReply);
        // If we got here, fullReply was actually a JSON string maybe?
        // This part depends on how the specific provider streams.
        // For now, if fullReply is empty but we have vars, use vars.
        if (Object.keys(extractedVarsRaw).length > 0) {
          // return what we have
        }
      } catch {}
    }

    // Transform vars to the expected format (MustHaveKey strings)
    const extractedVariables: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(extractedVarsRaw)) {
      extractedVariables[k] = v || null;
    }

    return {
      reply: fullReply || "Maaf, AI merespons tetapi tidak ada teks terformat terbaca.",
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
