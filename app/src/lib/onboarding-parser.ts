import type {
  MustHavesState,
  OnboardingApiResponse,
  MustHaveKey,
  OnboardingInputSource,
  SessionLanguage,
  SuggestedReply,
} from "@/types/schema";
import { normalizeMustHaveKey, MUST_HAVE_KEYS } from "@/types/schema";
import { MATURITY_RUBRICS } from "./onboarding-rubrics";
import { MUST_HAVE_UI_LABELS } from "./ui-copy";

function extractJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const candidates = [
    ...Array.from(
      cleaned.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi)
    ).map((match) => match[1]),
    cleaned,
  ];

  for (const candidate of candidates.reverse()) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {}
  }
  return null;
}

function cleanUpdates(value: unknown): Partial<MustHavesState> {
  if (!value || typeof value !== "object") return {};
  const updates: Partial<MustHavesState> = {};
  for (const [rawKey, rawValue] of Object.entries(
    value as Record<string, unknown>
  )) {
    const key = normalizeMustHaveKey(rawKey);
    if (key && typeof rawValue === "string" && rawValue.trim()) {
      updates[key] = rawValue.trim();
    }
  }
  return updates;
}

function cleanSuggestions(value: unknown): SuggestedReply[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const raw = item as Record<string, unknown>;
      if (typeof raw.label !== "string" || typeof raw.value !== "string") {
        return [];
      }
      return [
        {
          label: raw.label.slice(0, 80),
          value: raw.value.slice(0, 500),
          recommended: raw.recommended === true,
        },
      ];
    })
    .slice(0, 3);
}

const PROJECT_CONTEXT_MARKERS =
  /\b(personal|pribadi|harian|daily|kuliah|mahasiswa|student|sekolah|belajar|kantor|pekerjaan|kerja|team|tim|kolaborasi|kanban|proyek|project|keluarga|usaha|bisnis|umkm)\b/i;
const PROJECT_PROBLEM_MARKERS =
  /\b(sulit|kesulitan|bingung|lupa|terlambat|tercecer|tidak teratur|overwhelmed|miss|track|mengelola|memantau|prioritas|deadline|koordinasi|supaya|agar|sehingga|membantu)\b/i;
const GENERIC_PRODUCT_MARKERS =
  /\b(to[ -]?do(?: list)?|task(?: manager)?|e-?commerce|toko online|dashboard|chat app|aplikasi chat|website|mobile app)\b/i;

function focusedQuestion(
  activeVariable: MustHaveKey,
  missingDimension: string,
  language: SessionLanguage
): string {
  const isId = language === "id";
  const dimension = missingDimension.toLowerCase();
  if (activeVariable === "projectVision") {
    if (dimension.includes("context") || dimension.includes("user")) {
      return isId
        ? "Siapa yang paling sering menggunakan aplikasi ini, dan dalam konteks kegiatan apa?"
        : "Who will use this most often, and in what activity context?";
    }
    if (dimension.includes("problem")) {
      return isId
        ? "Kesulitan utama apa yang paling ingin diselesaikan untuk pengguna tersebut?"
        : "What is the main difficulty this should solve for that user?";
    }
    if (dimension.includes("outcome")) {
      return isId
        ? "Setelah memakai aplikasi ini, perubahan hasil apa yang paling ingin dirasakan pengguna?"
        : "After using this product, what outcome should improve most for the user?";
    }
    return isId
      ? "Seperti apa alur paling sederhana dari pengguna memasukkan tugas sampai tugas tersebut selesai?"
      : "What is the simplest workflow from capturing a task until it is completed?";
  }
  if (activeVariable === "techStackCore") {
    return isId
      ? "Aplikasi ini terutama akan digunakan sebagai web, mobile, atau desktop?"
      : "Will this primarily be a web, mobile, or desktop application?";
  }
  // Map internal key to user-friendly label
  const friendlyLabel = MUST_HAVE_UI_LABELS[activeVariable] || activeVariable;

  return isId
    ? `Mari fokus pada satu hal dulu: ${friendlyLabel}. Keputusan seperti apa yang paling sesuai dengan kebutuhan Anda?`
    : `Let us focus on one thing first: ${missingDimension}. What decision best fits your needs?`;
}

export function parseOnboardingResponse(
  text: string,
  activeVariable: MustHaveKey,
  language: SessionLanguage,
  lastUserMessage: string,
  clarificationTurns = 0,
  options: {
    currentDraft?: string | null;
    inputSource?: OnboardingInputSource;
  } = {}
): OnboardingApiResponse {
  const parsed = extractJsonObject(text);
  if (!parsed || typeof parsed.reply !== "string" || !parsed.reply.trim()) {
    return {
      reply:
        language === "id"
          ? `Saya belum bisa memastikan bagian ini dengan aman. Mari fokus pada satu hal dulu: ${MATURITY_RUBRICS[activeVariable][0]}. Bisa Anda jelaskan bagian tersebut?`
          : `I cannot confirm this safely yet. Let us focus on one thing first: ${MATURITY_RUBRICS[activeVariable][0]}. Could you clarify that part?`,
      activeVariable,
      maturity: "needs_clarification",
      draftValue: null,
      draftSource: "user",
      missingDimensions: MATURITY_RUBRICS[activeVariable],
      confirmedUpdates: {},
      provisionalUpdates: {},
      suggestedReplies: [],
      sessionLanguage: language,
      turnOutcome: "ambiguous",
    };
  }

  const parsedActive = normalizeMustHaveKey(
    typeof parsed.activeVariable === "string"
      ? parsed.activeVariable
      : activeVariable
  ) || activeVariable;
  const maturity = ["draft", "needs_clarification", "ready"].includes(
    String(parsed.maturity)
  )
    ? (parsed.maturity as OnboardingApiResponse["maturity"])
    : "needs_clarification";
  const missingDimensions = Array.isArray(parsed.missingDimensions)
    ? parsed.missingDimensions
        .filter((item): item is string => typeof item === "string")
        .slice(0, 4)
    : MATURITY_RUBRICS[parsedActive];
  const turnOutcome = ["accepted", "ambiguous", "off_topic"].includes(
    String(parsed.turnOutcome)
  )
    ? (parsed.turnOutcome as NonNullable<OnboardingApiResponse["turnOutcome"]>)
    : "ambiguous";

  const response: OnboardingApiResponse = {
    reply: parsed.reply.trim(),
    activeVariable: parsedActive,
    maturity,
    draftValue:
      typeof parsed.draftValue === "string" && parsed.draftValue.trim()
        ? parsed.draftValue.trim()
        : null,
    draftSource: ["user", "ai", "mixed"].includes(String(parsed.draftSource))
      ? (parsed.draftSource as OnboardingApiResponse["draftSource"])
      : /\b(tidak tahu|belum tahu|terserah|not sure|don't know|do not know)\b/i.test(
            lastUserMessage
          )
        ? "ai"
        : "user",
    missingDimensions,
    confirmedUpdates: cleanUpdates(parsed.confirmedUpdates),
    provisionalUpdates: cleanUpdates(parsed.provisionalUpdates),
    suggestedReplies: cleanSuggestions(parsed.suggestedReplies),
    sessionLanguage: language,
    turnOutcome,
  };

  if (turnOutcome === "off_topic") {
    response.activeVariable = activeVariable;
    response.maturity = "needs_clarification";
    response.draftValue = options.currentDraft ?? null;
    response.confirmedUpdates = {};
    response.provisionalUpdates = {};
  }

  let appliedGenericVisionGuard = false;

  // A generic todo/task statement is evidence, not a mature product vision.
  if (
    turnOutcome !== "off_topic" &&
    activeVariable === "projectVision" &&
    GENERIC_PRODUCT_MARKERS.test(lastUserMessage) &&
    (!PROJECT_CONTEXT_MARKERS.test(lastUserMessage) ||
      !PROJECT_PROBLEM_MARKERS.test(lastUserMessage))
  ) {
    appliedGenericVisionGuard = true;
    const draft =
      response.confirmedUpdates.projectVision ||
      response.provisionalUpdates.projectVision ||
      response.draftValue ||
      lastUserMessage;
    delete response.confirmedUpdates.projectVision;
    response.provisionalUpdates.projectVision = draft;
    response.maturity = "needs_clarification";
    response.missingDimensions = [
      "target user or usage context",
      "primary problem",
      "desired outcome",
    ];
    const isTodo = /\b(to[ -]?do|task|tugas)\b/i.test(lastUserMessage);
    response.reply = isTodo
      ? language === "id"
        ? "Todo list bisa berarti pencatat tugas pribadi, pengelola tugas kuliah, atau board kerja tim seperti Kanban. Agar saya tidak salah arah, aplikasi ini terutama dipakai dalam konteks yang mana?"
        : "A todo list could mean personal daily tasks, study assignments, or a team work board such as Kanban. Which context is the primary one for this product?"
      : language === "id"
        ? "Nama jenis aplikasinya sudah menjadi titik awal, tetapi konteks dan masalahnya belum cukup jelas. Siapa pengguna utamanya, dan kesulitan apa yang paling ingin diselesaikan?"
        : "The product category is a useful starting point, but its context and problem are still unclear. Who is the primary user, and what difficulty should it solve?";
    response.suggestedReplies = isTodo
      ? language === "id"
        ? [
            {
              label: "Pribadi harian",
              value:
                "Untuk penggunaan pribadi sehari-hari agar tugas dan prioritas tidak terlewat.",
              recommended: true,
            },
            {
              label: "Kuliah atau belajar",
              value:
                "Untuk mahasiswa mengelola tugas kuliah, deadline, dan prioritas belajar.",
            },
            {
              label: "Kerja tim / Kanban",
              value:
                "Untuk tim kecil mengatur pekerjaan bersama dalam alur seperti Kanban.",
            },
          ]
        : [
            {
              label: "Personal daily use",
              value:
                "For personal daily use so tasks and priorities are not missed.",
              recommended: true,
            },
            {
              label: "Study",
              value:
                "For students managing assignments, deadlines, and study priorities.",
            },
            {
              label: "Team / Kanban",
              value:
                "For a small team coordinating shared work in a Kanban-like flow.",
            },
          ]
      : [];
  }

  if (
    turnOutcome !== "off_topic" &&
    !appliedGenericVisionGuard &&
    response.maturity === "needs_clarification" &&
    response.missingDimensions.length > 1
  ) {
    response.reply = focusedQuestion(
      activeVariable,
      response.missingDimensions[0],
      language
    );
    response.missingDimensions = response.missingDimensions.slice(0, 1);
  }

  if (
    turnOutcome !== "off_topic" &&
    clarificationTurns >= 2 &&
    !response.suggestedReplies.some((suggestion) => suggestion.recommended)
  ) {
    response.suggestedReplies.unshift({
      label:
        language === "id"
          ? "Gunakan rekomendasi AI"
          : "Use AI recommendation",
      value:
        language === "id"
          ? "Saya belum yakin. Berikan satu rekomendasi paling masuk akal berdasarkan konteks yang sudah ada, jelaskan trade-off singkatnya, lalu minta konfirmasi saya."
          : "I am not sure. Give me the single most sensible recommendation from the existing context, explain one short trade-off, then ask for my confirmation.",
      recommended: true,
    });
    response.suggestedReplies = response.suggestedReplies.slice(0, 3);
  }

  return response;
}
