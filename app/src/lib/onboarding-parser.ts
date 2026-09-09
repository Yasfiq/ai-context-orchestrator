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
export function getDefaultSuggestions(
  activeVariable: MustHaveKey,
  language: SessionLanguage
): SuggestedReply[] {
  const isId = language === "id";
  switch (activeVariable) {
    case "projectVision":
      return isId
        ? [
            {
              label: "Katalog & Pencarian",
              value:
                "Aplikasi direktori/katalog terkurasi dengan pencarian cepat dan filter multi-kategori.",
              recommended: true,
            },
            {
              label: "Kebutuhan Pribadi & Kerja",
              value:
                "Membantu pengguna menemukan dan membandingkan opsi terbaik untuk kebutuhan harian atau tim.",
            },
            {
              label: "Rekomendasi AI",
              value:
                "Rekomendasikan alur utama dan fokus nilai produk berdasarkan konteks yang ada.",
            },
          ]
        : [
            {
              label: "Directory & Discovery",
              value:
                "A curated directory application with fast search and multi-category filters.",
              recommended: true,
            },
            {
              label: "Personal & Work Needs",
              value:
                "Help users quickly discover and compare the best options for their workflows.",
            },
            {
              label: "AI Recommendation",
              value:
                "Recommend the core workflow and value focus based on existing context.",
            },
          ];

    case "userRolesPermissions":
      return isId
        ? [
            {
              label: "Admin & Publik",
              value:
                "Admin mengelola dan memverifikasi data; pengguna publik mencari dan melihat detail secara terbuka.",
              recommended: true,
            },
            {
              label: "Pengguna Terdaftar",
              value:
                "Pengguna terdaftar dapat menyimpan bookmark, memberi rating, dan menulis ulasan.",
            },
            {
              label: "Akses Sederhana",
              value:
                "Tanpa login untuk pencarian dasar; autentikasi hanya diperlukan saat mengelola data.",
            },
          ]
        : [
            {
              label: "Admin & Public",
              value:
                "Admin manages and moderates content; public users search and browse freely.",
              recommended: true,
            },
            {
              label: "Registered Users",
              value:
                "Registered users can bookmark favorites, rate items, and leave reviews.",
            },
            {
              label: "Simple Access",
              value:
                "No login required for browsing; authentication only needed for admin operations.",
            },
          ];

    case "keyFeatures":
      return isId
        ? [
            {
              label: "Pencarian & Filter Cerdas",
              value:
                "Pencarian cepat, filter berbasis kegunaan/kategori/harga, dan pengurutan popularitas pengguna.",
              recommended: true,
            },
            {
              label: "Detail & Alternatif Tools",
              value:
                "Halaman detail lengkap dengan deskripsi, panduan best practice, dan rekomendasi alternatif.",
            },
            {
              label: "Review & Bookmark",
              value:
                "Fitur bookmark favorit pengguna dan review/rating komunitas.",
            },
          ]
        : [
            {
              label: "Search & Multi-Filter",
              value:
                "Fast search, multi-category and price filters, and sorting by user popularity.",
              recommended: true,
            },
            {
              label: "Tool Details & Alternatives",
              value:
                "Detailed item view with descriptions, best practices, and curated alternatives.",
            },
            {
              label: "Bookmarks & Ratings",
              value:
                "User bookmarking and community reviews or popularity metrics.",
            },
          ];

    case "techStackCore":
      return isId
        ? [
            {
              label: "Next.js & Cloudflare",
              value:
                "Next.js frontend modern dengan edge backend Cloudflare Workers/Pages.",
              recommended: true,
            },
            {
              label: "Fullstack React / Node",
              value:
                "Fullstack React dengan Node.js/TypeScript backend dan PostgreSQL/SQLite.",
            },
            {
              label: "Rekomendasi AI",
              value:
                "Pilihkan arsitektur stack paling ringan, cepat, dan mudah di-deploy.",
            },
          ]
        : [
            {
              label: "Next.js & Cloudflare",
              value:
                "Modern Next.js frontend with Cloudflare Workers/Pages edge backend.",
              recommended: true,
            },
            {
              label: "Fullstack React / Node",
              value:
                "Fullstack React with Node.js/TypeScript backend and PostgreSQL/SQLite.",
            },
            {
              label: "AI Recommendation",
              value:
                "Recommend the lightest and fastest deployable tech stack.",
            },
          ];

    case "dataFlowIntegration":
      return isId
        ? [
            {
              label: "Database Relasional & API",
              value:
                "Data direktori disimpan dalam database relasional dengan REST API untuk pencarian dan pemfilteran.",
              recommended: true,
            },
            {
              label: "Data Terstruktur & Cache",
              value:
                "Penyimpanan data terstruktur dengan caching di edge untuk response pencarian instan.",
            },
            {
              label: "Integrasi Eksternal Minimal",
              value:
                "Fokus pada data internal terlebih dahulu tanpa ketergantungan API pihak ketiga yang kompleks.",
            },
          ]
        : [
            {
              label: "Relational DB & API",
              value:
                "Data stored in relational database with REST APIs for search and filtering.",
              recommended: true,
            },
            {
              label: "Structured Data & Cache",
              value:
                "Cloud storage with edge caching for instant search and query responses.",
            },
            {
              label: "Minimal External Integrations",
              value:
                "Focus on internal data first without complex third-party API dependencies.",
            },
          ];

    case "qaAndTesting":
      return isId
        ? [
            {
              label: "Unit & E2E Testing",
              value:
                "Unit test untuk fungsi pencarian & filter, serta E2E test untuk alur utama pengguna.",
              recommended: true,
            },
            {
              label: "Smoke Test Kritis",
              value:
                "Verifikasi alur kritis (pencarian, navigasi detail, respon filter) sebelum rilis.",
            },
            {
              label: "Rekomendasi AI",
              value:
                "Rekomendasikan strategi pengujian otomatis yang praktis dan efektif.",
            },
          ]
        : [
            {
              label: "Unit & E2E Testing",
              value:
                "Unit tests for search and filtering logic, plus E2E tests for core user journeys.",
              recommended: true,
            },
            {
              label: "Critical Flow Smoke",
              value:
                "Verification of critical user flows (search, details, filtering) prior to release.",
            },
            {
              label: "AI Recommendation",
              value:
                "Recommend a practical and high-confidence automated QA strategy.",
            },
          ];

    case "securityCompliance":
      return isId
        ? [
            {
              label: "Standar Keamanan Web",
              value:
                "Sanitasi input pencarian, proteksi CORS/CSRF, dan rate limiting pada endpoint publik.",
              recommended: true,
            },
            {
              label: "Privasi Data Dasar",
              value:
                "Hanya data publik tanpa PII sensitif, komunikasi selalu melalui HTTPS.",
            },
            {
              label: "Rekomendasi AI",
              value:
                "Rekomendasikan baseline keamanan yang sesuai untuk aplikasi direktori publik.",
            },
          ]
        : [
            {
              label: "Standard Web Security",
              value:
                "Input sanitation, CORS/CSRF protection, and rate limiting on public endpoints.",
              recommended: true,
            },
            {
              label: "Basic Data Privacy",
              value:
                "Public directory data without sensitive PII, strictly HTTPS encrypted.",
            },
            {
              label: "AI Recommendation",
              value:
                "Recommend essential security practices for this application.",
            },
          ];

    case "teamPersonas":
      return isId
        ? [
            {
              label: "Fullstack Engineer",
              value:
                "Satu engineer bertanggung jawab atas UI, API endpoint, dan integrasi database.",
              recommended: true,
            },
            {
              label: "Frontend & Backend Terpisah",
              value:
                "Pemisahan fokus: Frontend engineer untuk UI/UX pencarian, Backend engineer untuk data & performa.",
            },
            {
              label: "Rekomendasi AI",
              value:
                "Rekomendasikan pembagian peran tim teknis yang paling efisien.",
            },
          ]
        : [
            {
              label: "Fullstack Engineer",
              value:
                "Single engineer covering frontend UI, API endpoints, and database integration.",
              recommended: true,
            },
            {
              label: "Frontend & Backend Roles",
              value:
                "Divided roles: Frontend engineer for search UI/UX, Backend engineer for data & performance.",
            },
            {
              label: "AI Recommendation",
              value:
                "Recommend an efficient technical team structure.",
            },
          ];

    default:
      return [
        {
          label: isId ? "Gunakan rekomendasi AI" : "Use AI recommendation",
          value: isId
            ? "Saya ingin menggunakan rekomendasi terbaik berdasarkan konteks yang ada."
            : "I want to use the best recommendation based on the current context.",
          recommended: true,
        },
      ];
  }
}

function cleanTextForFallback(text: string): string {
  return text
    .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
    .replace(/^(?:thinking process|thought|reasoning):\s*[\s\S]*?(?:\n\n|$)/im, "")
    .replace(/```(?:json)?[\s\S]*?```/gi, "")
    .trim();
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text
    .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
    .replace(/^(?:thinking process|thought|reasoning):\s*[\s\S]*?(?:\n\n|$)/im, "")
    .trim();

  // 1. Check markdown json code blocks
  const codeBlockMatches = Array.from(
    cleaned.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi)
  );
  for (let i = codeBlockMatches.length - 1; i >= 0; i -= 1) {
    try {
      const parsed = JSON.parse(codeBlockMatches[i][1].trim());
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {}
  }

  // 2. Direct JSON parse
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {}

  // 3. Balanced brace parsing from last match backward
  const matches = Array.from(cleaned.matchAll(/\{[\s\S]*?\}/g));
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const startIndex = matches[index].index;
    if (typeof startIndex !== "number") continue;
    let braceCount = 0;
    let endIndex = -1;
    let inString = false;
    let escaped = false;

    for (let cursor = startIndex; cursor < cleaned.length; cursor += 1) {
      const character = cleaned[cursor];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === "\\") {
        escaped = true;
        continue;
      }

      if (character === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (character === "{") braceCount += 1;
        if (character === "}") {
          braceCount -= 1;
          if (braceCount === 0) {
            endIndex = cursor + 1;
            break;
          }
        }
      }
    }

    if (endIndex === -1) continue;

    try {
      const parsed = JSON.parse(cleaned.substring(startIndex, endIndex));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {}
  }

  // 4. Fallback regex for "reply" in case of truncated or malformed JSON
  const replyMatch = cleaned.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (replyMatch) {
    try {
      const reply = JSON.parse(`"${replyMatch[1]}"`);
      return { reply };
    } catch {
      return { reply: replyMatch[1] };
    }
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
  let parsed = extractJsonObject(text);

  if (parsed && (!parsed.reply || typeof parsed.reply !== "string")) {
    const alternateReply =
      (typeof parsed.message === "string" && parsed.message) ||
      (typeof parsed.response === "string" && parsed.response) ||
      (typeof parsed.answer === "string" && parsed.answer) ||
      (typeof parsed.content === "string" && parsed.content);
    if (alternateReply) {
      parsed.reply = alternateReply;
    }
  }

  if (!parsed || typeof parsed.reply !== "string" || !parsed.reply.trim()) {
    const cleanedText = cleanTextForFallback(text);
    const looksLikePlainReply =
      cleanedText.length >= 15 &&
      !cleanedText.startsWith("{") &&
      !cleanedText.endsWith("}");

    const fallbackReply = looksLikePlainReply
      ? cleanedText.slice(0, 1000).trim()
      : focusedQuestion(
          activeVariable,
          MATURITY_RUBRICS[activeVariable][0],
          language
        );

    return {
      reply: fallbackReply,
      activeVariable,
      maturity: "needs_clarification",
      draftValue:
        options.currentDraft ??
        (lastUserMessage.trim().length > 10 ? lastUserMessage.trim() : null),
      draftSource: "user",
      missingDimensions: MATURITY_RUBRICS[activeVariable].slice(0, 1),
      confirmedUpdates: {},
      provisionalUpdates:
        lastUserMessage.trim().length > 10
          ? { [activeVariable]: lastUserMessage.trim() }
          : {},
      suggestedReplies: getDefaultSuggestions(activeVariable, language),
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
    : MATURITY_RUBRICS[parsedActive].slice(0, 1);
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

  // Ensure suggestion chips are always available with at least one recommended option
  if (response.suggestedReplies.length === 0) {
    response.suggestedReplies = getDefaultSuggestions(
      response.activeVariable,
      language
    );
  } else if (!response.suggestedReplies.some((suggestion) => suggestion.recommended)) {
    response.suggestedReplies[0].recommended = true;
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
