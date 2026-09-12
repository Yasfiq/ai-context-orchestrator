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
              label: "Workflow Bisnis & B2B",
              value:
                "Solusi operasional B2B untuk mengotomasi alur kerja, transaksi, dan verifikasi antar pihak.",
              recommended: true,
            },
            {
              label: "SaaS Multi-Tenant / Cloud",
              value:
                "Platform SaaS mandiri yang dapat diakses multi-pengguna dengan dashboard dan peran terkelola.",
            },
            {
              label: "Portal Solusi Spesifik",
              value:
                "Aplikasi khusus yang memecahkan satu hambatan utama pengguna dengan alur ringkas dan terarah.",
            },
          ]
        : [
            {
              label: "B2B & Business Workflow",
              value:
                "B2B operational solution automating workflows, transactions, and multi-party verification.",
              recommended: true,
            },
            {
              label: "SaaS / Multi-Tenant",
              value:
                "Self-serve cloud platform accessible by multiple users with managed dashboards and roles.",
            },
            {
              label: "Specialized Portal",
              value:
                "Dedicated application solving a single critical user bottleneck with a focused flow.",
            },
          ];

    case "userRolesPermissions":
      return isId
        ? [
            {
              label: "Role Berlapis (Admin, Operator, User)",
              value:
                "Pemisahan wewenang yang tegas antara administrator, operator kerja, dan pengguna akhir/klien.",
              recommended: true,
            },
            {
              label: "Dua Sisi (Pemohon & Penyedia)",
              value:
                "Dua peran utama yang saling berinteraksi dengan alur verifikasi atau transaksi timbal-balik.",
            },
            {
              label: "Internal Tim Terpadu",
              value:
                "Akses terverifikasi untuk seluruh staf internal dengan tingkat izin sesuai departemen.",
            },
          ]
        : [
            {
              label: "Layered Roles (Admin, Operator, User)",
              value:
                "Strict role boundaries between system admins, operational actors, and end-users/clients.",
              recommended: true,
            },
            {
              label: "Two-Sided (Requester & Provider)",
              value:
                "Two primary roles interacting through reciprocal verification or transaction workflows.",
            },
            {
              label: "Unified Internal Team",
              value:
                "Authenticated access for internal staff with department-level permission tiers.",
            },
          ];

    case "keyFeatures":
      return isId
        ? [
            {
              label: "Alur Inti & Otomasi Proses",
              value:
                "Otomasi tahapan proses utama dari input awal, verifikasi status, hingga penyelesaian tuntas.",
              recommended: true,
            },
            {
              label: "Dashboard & Monitoring Real-time",
              value:
                "Panel pemantauan status real-time, pelacakan riwayat aktivitas, dan notifikasi perubahan.",
            },
            {
              label: "Pencarian & Laporan Terstruktur",
              value:
                "Pencarian cepat, filter status komprehensif, dan ekspor data laporan terstruktur.",
            },
          ]
        : [
            {
              label: "Core Workflow & Automation",
              value:
                "End-to-end automation of the main process from initial input, status checks, to completion.",
              recommended: true,
            },
            {
              label: "Real-time Dashboard & Tracking",
              value:
                "Real-time status monitoring panel, activity audit tracking, and event change alerts.",
            },
            {
              label: "Search & Structured Reports",
              value:
                "Fast search, comprehensive status filters, and structured data report exports.",
            },
          ];

    case "techStackCore":
      return isId
        ? [
            {
              label: "Edge Serverless (Next.js + Cloudflare)",
              value:
                "Frontend Next.js App Router dengan backend Cloudflare Workers untuk latensi ultra-rendah.",
              recommended: true,
            },
            {
              label: "Fullstack Node.js + PostgreSQL",
              value:
                "Next.js fullstack dengan Node.js runtime dan database relasional PostgreSQL ACID.",
            },
            {
              label: "Rekomendasi Arsitektur Terbaik",
              value:
                "Rekomendasikan arsitektur teknologi paling stabil, scalable, dan sesuai dengan batasan proyek ini.",
            },
          ]
        : [
            {
              label: "Edge Serverless (Next.js + Cloudflare)",
              value:
                "Modern Next.js App Router frontend with Cloudflare Workers backend for ultra-low latency.",
              recommended: true,
            },
            {
              label: "Fullstack Node.js + PostgreSQL",
              value:
                "Next.js fullstack with Node.js runtime and relational PostgreSQL database (ACID compliant).",
            },
            {
              label: "Best Architecture Recommendation",
              value:
                "Recommend the most stable and scalable tech architecture tailored to this project's constraints.",
            },
          ];

    case "dataFlowIntegration":
      return isId
        ? [
            {
              label: "REST API & Webhook Asinkron",
              value:
                "REST API untuk operasi langsung dan webhook asinkron untuk integrasi event pihak ketiga.",
              recommended: true,
            },
            {
              label: "Database Relasional & Audit Log",
              value:
                "Penyimpanan data relasional dengan riwayat log transaksi yang tidak dapat diubah (append-only).",
            },
            {
              label: "Event-Driven Message Queue",
              value:
                "Antrean pesan asinkron untuk memproses transaksi beban tinggi secara andal.",
            },
          ]
        : [
            {
              label: "REST API & Async Webhooks",
              value:
                "REST APIs for direct operations and async webhooks for external third-party events.",
              recommended: true,
            },
            {
              label: "Relational DB & Audit Log",
              value:
                "Relational data persistence with an immutable append-only transaction audit log.",
            },
            {
              label: "Event-Driven Message Queue",
              value:
                "Asynchronous message queue to reliably process high-throughput transaction events.",
            },
          ];

    case "qaAndTesting":
      return isId
        ? [
            {
              label: "Unit Test & E2E Alur Utama",
              value:
                "Unit test logika bisnis dan Playwright E2E untuk memvalidasi alur kritis pengguna.",
              recommended: true,
            },
            {
              label: "Integration & Webhook Replay",
              value:
                "Pengujian integrasi antar modul dan simulasi replay webhook pihak ketiga/perbankan.",
            },
            {
              label: "Smoke Test & Type Checking Ketat",
              value:
                "Validasi tipe data TypeScript ketat dan smoke test otomatis pada setiap pipeline CI/CD.",
            },
          ]
        : [
            {
              label: "Unit Tests & Core E2E Flows",
              value:
                "Business logic unit tests and Playwright E2E tests validating critical user journeys.",
              recommended: true,
            },
            {
              label: "Integration & Webhook Replay",
              value:
                "Cross-module integration tests and third-party/banking webhook replay simulation.",
            },
            {
              label: "Smoke Tests & Strict Types",
              value:
                "Strict TypeScript type checking and automated smoke tests on every CI/CD pipeline.",
            },
          ];

    case "securityCompliance":
      return isId
        ? [
            {
              label: "Enkripsi Data & RBAC Ketat",
              value:
                "Enkripsi data at-rest & in-transit, otentikasi aman, dan kontrol akses berbasis peran (RBAC).",
              recommended: true,
            },
            {
              label: "Audit Trail & Kepatuhan Regulasi",
              value:
                "Pencatatan log transaksi yang tamper-proof sesuai standar regulasi dan privasi data.",
            },
            {
              label: "Proteksi API & Sanitasi Input",
              value:
                "Rate limiting, validasi skema payload ketat, dan perlindungan terhadap injeksi data.",
            },
          ]
        : [
            {
              label: "Data Encryption & Strict RBAC",
              value:
                "Data encryption at-rest and in-transit, secure auth, and role-based access control (RBAC).",
              recommended: true,
            },
            {
              label: "Audit Trail & Regulatory Compliance",
              value:
                "Tamper-proof transaction logging conforming to data privacy and regulatory standards.",
            },
            {
              label: "API Protection & Input Sanitization",
              value:
                "Rate limiting, strict payload schema validation, and injection vulnerability defense.",
            },
          ];

    case "teamPersonas":
      return isId
        ? [
            {
              label: "Frontend, Backend & QA Engineer",
              value:
                "Tim agen spesialis: Frontend UI/UX, Backend Edge/API Engineer, dan QA Automation Tester.",
              recommended: true,
            },
            {
              label: "Arsitek Sistem & Security Officer",
              value:
                "Fokus pada peran arsitek teknis sistem, pakar integrasi pihak ketiga, dan auditor keamanan.",
            },
            {
              label: "Fullstack Lean Team",
              value:
                "Agen fullstack serbaguna untuk iterasi cepat dengan fokus pengiriman fitur end-to-end.",
            },
          ]
        : [
            {
              label: "Frontend, Backend & QA Engineers",
              value:
                "Specialist agents: Frontend UI/UX, Backend Edge/API Engineer, and QA Automation Tester.",
              recommended: true,
            },
            {
              label: "System Architect & Security Officer",
              value:
                "Focused on technical system architect, third-party integration expert, and security auditor.",
            },
            {
              label: "Fullstack Lean Team",
              value:
                "Versatile fullstack agent for rapid iteration and end-to-end feature delivery.",
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
      if (!item) return [];

      // Tolerate LLM returning an array of strings
      if (typeof item === "string") {
        const str = item.trim();
        if (!str) return [];
        const splitIdx = str.indexOf(": ");
        const label = splitIdx !== -1 ? str.slice(0, splitIdx).trim() : str.slice(0, 40).trim();
        return [
          {
            label: label.slice(0, 80),
            value: str.slice(0, 500),
            recommended: false,
          },
        ];
      }

      if (typeof item !== "object") return [];
      const raw = item as Record<string, unknown>;

      // Tolerate alternate field names from LLM
      const label =
        (typeof raw.label === "string" && raw.label) ||
        (typeof raw.title === "string" && raw.title) ||
        (typeof raw.name === "string" && raw.name) ||
        (typeof raw.option === "string" && raw.option) ||
        "";

      const val =
        (typeof raw.value === "string" && raw.value) ||
        (typeof raw.description === "string" && raw.description) ||
        (typeof raw.text === "string" && raw.text) ||
        label;

      if (!label.trim()) return [];

      return [
        {
          label: label.trim().slice(0, 80),
          value: val.trim().slice(0, 500),
          recommended: raw.recommended === true,
        },
      ];
    })
    .slice(0, 4);
}

const PROJECT_CONTEXT_MARKERS =
  /\b(personal|pribadi|harian|daily|kuliah|mahasiswa|student|sekolah|belajar|kantor|pekerjaan|kerja|team|tim|kolaborasi|kanban|proyek|project|keluarga|usaha|bisnis|umkm)\b/i;

/**
 * Extracts numbered/bulleted options from the AI reply text so contextual
 * choices can be surfaced as clickable suggestion chips when the LLM
 * puts options inline in the reply instead of in suggestedReplies.
 */
function extractSuggestionsFromReply(replyText: string): SuggestedReply[] {
  if (!replyText || replyText.length < 15) return [];

  // Match numbered (1., 2.), lettered (A., B.), or bulleted (-, *) lines
  const optionRegex = /^\s*(?:(?:(?:\d+|[a-zA-Z])[.)])|(?:[-*•]))\s+(.+)$/gm;
  const matches: string[] = [];
  let match;
  while ((match = optionRegex.exec(replyText)) !== null) {
    const line = match[1].trim();
    if (line.length > 3) {
      matches.push(line);
    }
  }

  if (matches.length < 2) return [];

  return matches.slice(0, 4).map((item, index) => {
    // Try to split at colon or dash for label vs value
    const colonIdx = item.indexOf(": ");
    const dashIdx = item.indexOf(" — ");
    const splitIdx = colonIdx !== -1 ? colonIdx : dashIdx !== -1 ? dashIdx : -1;

    let label = splitIdx !== -1 ? item.slice(0, splitIdx).trim() : item.slice(0, 60).trim();
    // Strip bold markdown
    label = label.replace(/\*\*/g, "");

    return {
      label: label.slice(0, 80),
      value: item.replace(/\*\*/g, "").slice(0, 500),
      recommended: index === 0,
    };
  });
}

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
      suggestedReplies: (() => {
        const extracted = extractSuggestionsFromReply(fallbackReply);
        return extracted.length >= 2 ? extracted : getDefaultSuggestions(activeVariable, language);
      })(),
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
    suggestedReplies: cleanSuggestions(
      parsed.suggestedReplies || parsed.suggestions || parsed.options || parsed.choices
    ),
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
    const extracted = extractSuggestionsFromReply(response.reply);
    response.suggestedReplies =
      extracted.length >= 2
        ? extracted
        : getDefaultSuggestions(response.activeVariable, language);
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
