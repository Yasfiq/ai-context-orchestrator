import type {
  DiscoveryState,
  MustHaveKey,
  MustHavesState,
  OnboardingApiResponse,
  OnboardingInputSource,
  SessionLanguage,
  SuggestedReply,
} from "@/types/schema";
import { MUST_HAVE_KEYS, normalizeMustHaveKey } from "@/types/schema";
import { MUST_HAVE_UI_LABELS } from "./ui-copy";

export function normalizeDiscoveryState(
  value: unknown,
  mustHaves: MustHavesState
): DiscoveryState {
  const raw =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return Object.fromEntries(
    MUST_HAVE_KEYS.map((key) => {
      const entry =
        raw[key] && typeof raw[key] === "object"
          ? (raw[key] as Record<string, unknown>)
          : {};
      const confirmed = Boolean(mustHaves[key]?.trim());
      return [
        key,
        {
          draftValue:
            typeof entry.draftValue === "string"
              ? entry.draftValue.slice(0, 10_000)
              : mustHaves[key],
          status: confirmed
            ? "confirmed"
            : ["empty", "draft", "recommended"].includes(String(entry.status))
              ? entry.status
              : "empty",
          source: ["user", "ai", "mixed"].includes(String(entry.source))
            ? entry.source
            : "user",
          missingDimensions: Array.isArray(entry.missingDimensions)
            ? entry.missingDimensions
                .filter((item): item is string => typeof item === "string")
                .slice(0, 6)
            : [],
          clarificationTurns:
            typeof entry.clarificationTurns === "number"
              ? Math.min(Math.max(entry.clarificationTurns, 0), 5)
              : 0,
          needsReview: entry.needsReview === true,
        },
      ];
    })
  ) as DiscoveryState;
}

export const MATURITY_RUBRICS: Record<MustHaveKey, string[]> = {
  projectVision: [
    "target user or usage context",
    "primary problem",
    "desired outcome",
    "product workflow or shape",
  ],
  userRolesPermissions: [
    "primary actors",
    "what each actor can do",
    "meaningful access boundaries",
  ],
  keyFeatures: [
    "three to five MVP capabilities",
    "the highest-priority capability",
    "connection to the confirmed user problem",
  ],
  techStackCore: [
    "target platform and constraints",
    "one coherent recommended preset",
    "explicit user confirmation",
  ],
  dataFlowIntegration: [
    "data sources",
    "storage destination",
    "external integrations or explicit absence",
  ],
  qaAndTesting: [
    "critical user flows",
    "appropriate test levels",
    "minimum release confidence",
  ],
  securityCompliance: [
    "data sensitivity",
    "authentication requirement",
    "privacy or compliance constraints",
  ],
  teamPersonas: [
    "work domains that need ownership",
    "agent responsibility boundaries",
    "expected collaboration or handoff",
  ],
};

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

export function getActiveDiscoveryVariable(
  mustHaves: MustHavesState,
  discovery: DiscoveryState
): MustHaveKey {
  return (
    MUST_HAVE_KEYS.find(
      (key) =>
        !mustHaves[key]?.trim() ||
        discovery[key].status !== "confirmed" ||
        discovery[key].needsReview
    ) || "teamPersonas"
  );
}

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

export function createOnboardingFallback(
  activeVariable: MustHaveKey,
  language: SessionLanguage
): OnboardingApiResponse {
  const missingDimensions = MATURITY_RUBRICS[activeVariable];
  const isId = language === "id";
  return {
    reply: isId
      ? `Saya belum bisa memastikan bagian ini dengan aman. Mari fokus pada satu hal dulu: ${missingDimensions[0]}. Bisa Anda jelaskan bagian tersebut?`
      : `I cannot confirm this safely yet. Let us focus on one thing first: ${missingDimensions[0]}. Could you clarify that part?`,
    activeVariable,
    maturity: "needs_clarification",
    draftValue: null,
    draftSource: "user",
    missingDimensions,
    confirmedUpdates: {},
    provisionalUpdates: {},
    suggestedReplies: [],
    sessionLanguage: language,
    turnOutcome: "ambiguous",
  };
}

const AFFIRMATIVE =
  /^\s*(?:ya|iya|setuju|cocok|oke|ok|lanjut|pilih itu|gunakan(?: rekomendasi(?: itu)?)?|yes|agree|sounds good|use it)[.!]?\s*$/i;
const UNSURE =
  /\b(tidak tahu|belum tahu|belum yakin|terserah|rekomendasikan|not sure|don't know|do not know|recommend)\b/i;

type PlatformChoice = "Mobile" | "Desktop" | "Responsive Web/PWA";

function classifyPlatformChoice(message: string): PlatformChoice | null {
  const explicitWeb =
    /\b(web\s*(?:app|application)?|aplikasi\s+web|website|browser|pwa|next\.?js|vite)\b/i.test(
      message
    );
  const explicitNativeMobile =
    /\b(?:mobile\s+(?:app|application|native)|aplikasi\s+mobile|native\s+mobile|android|ios|react\s+native|flutter)\b/i.test(
      message
    );
  const explicitNativeDesktop =
    /\b(?:desktop\s+(?:app|application|native)|aplikasi\s+desktop|native\s+desktop|electron|tauri)\b/i.test(
      message
    );

  const explicitChoices = [
    explicitWeb,
    explicitNativeMobile,
    explicitNativeDesktop,
  ].filter(Boolean).length;
  if (explicitChoices > 1) return null;
  if (explicitWeb) return "Responsive Web/PWA";
  if (explicitNativeMobile) return "Mobile";
  if (explicitNativeDesktop) return "Desktop";

  const mentionsMobile = /\bmobile\b/i.test(message);
  const mentionsDesktop = /\bdesktop\b/i.test(message);
  if (mentionsMobile && mentionsDesktop) return null;
  if (mentionsMobile) return "Mobile";
  if (mentionsDesktop) return "Desktop";
  return null;
}

function platformRecommendation(
  language: SessionLanguage
): OnboardingApiResponse {
  const isId = language === "id";
  return {
    reply: isId
      ? "Saya merekomendasikan **web responsif/PWA** lebih dulu: satu aplikasi dapat dibuka di HP dan laptop tanpa proses instalasi store. Trade-off-nya, notifikasi background tidak sekuat aplikasi mobile native. Apakah platform web/PWA cocok?"
      : "I recommend a **responsive web app/PWA** first: one application works on phones and laptops without an app-store installation. The trade-off is weaker background notifications than a native mobile app. Does web/PWA fit?",
    activeVariable: "techStackCore",
    maturity: "needs_clarification",
    draftValue: "Platform recommendation: Responsive Web/PWA (awaiting confirmation)",
    draftSource: "ai",
    missingDimensions: ["explicit platform confirmation"],
    confirmedUpdates: {},
    provisionalUpdates: {},
    suggestedReplies: [
      {
        label: isId ? "Setuju web/PWA" : "Use web/PWA",
        value: isId
          ? "Ya, gunakan web responsif/PWA."
          : "Yes, use a responsive web app/PWA.",
        recommended: true,
      },
      {
        label: isId ? "Lebih cocok mobile" : "Prefer mobile",
        value: isId
          ? "Saya lebih membutuhkan aplikasi mobile native."
          : "I need a native mobile application instead.",
      },
    ],
    sessionLanguage: language,
    turnOutcome: "ambiguous",
  };
}

function platformQuestion(language: SessionLanguage): OnboardingApiResponse {
  const response = platformRecommendation(language);
  return {
    ...response,
    reply:
      language === "id"
        ? "Jawaban tersebut belum menjawab pilihan platform. Aplikasi ini terutama akan digunakan sebagai web, mobile, atau desktop?"
        : "That answer does not address the platform choice. Will this primarily be a web, mobile, or desktop application?",
    draftValue: null,
    draftSource: "user",
    turnOutcome: "off_topic",
  };
}

function keepCurrentTechDecision(
  response: OnboardingApiResponse,
  language: SessionLanguage
): OnboardingApiResponse {
  return {
    ...response,
    reply:
      language === "id"
        ? `Jawaban tersebut belum menjawab keputusan tech stack yang sedang aktif. ${response.reply}`
        : `That answer does not address the active tech-stack decision. ${response.reply}`,
    confirmedUpdates: {},
    provisionalUpdates: {},
    turnOutcome: "off_topic",
  };
}

export function createTechStackGuidance(
  lastUserMessage: string,
  existingDraft: string | null,
  language: SessionLanguage,
  _inputSource: OnboardingInputSource = "manual"
): OnboardingApiResponse {
  const isId = language === "id";
  const draft = existingDraft || "";
  const isStructuredDraft =
    /(?:Platform|Framework|Styling|State) (?:recommendation|:)/.test(draft);

  if (!draft || !isStructuredDraft) {
    const directPlatform = classifyPlatformChoice(lastUserMessage);

    if (!directPlatform) {
      return UNSURE.test(lastUserMessage)
        ? platformRecommendation(language)
        : platformQuestion(language);
    }

    return {
      ...frameworkRecommendation(directPlatform, language),
      turnOutcome: "accepted",
    };
  }

  if (draft.includes("Platform recommendation:")) {
    const platform = AFFIRMATIVE.test(lastUserMessage)
      ? "Responsive Web/PWA"
      : classifyPlatformChoice(lastUserMessage);
    return platform
      ? { ...frameworkRecommendation(platform, language), turnOutcome: "accepted" }
      : keepCurrentTechDecision(platformRecommendation(language), language);
  }

  if (draft.includes("Framework recommendation:")) {
    const platform =
      draft.match(/Platform: (.*?) \(confirmed\)/)?.[1] ||
      "Responsive Web/PWA";
    const recommended = platform === "Mobile" ? "React Native" : "Next.js";
    const alternative =
      platform === "Mobile" ? "Flutter" : "React SPA with Vite";
    const framework =
      platform === "Mobile" && /\bflutter\b/i.test(lastUserMessage)
        ? alternative
        : platform === "Mobile" && /\breact native\b/i.test(lastUserMessage)
          ? recommended
          : platform !== "Mobile" && /\b(vite|react spa)\b/i.test(lastUserMessage)
            ? alternative
            : platform !== "Mobile" && /\bnext\.?js\b/i.test(lastUserMessage)
              ? recommended
              : AFFIRMATIVE.test(lastUserMessage)
                ? recommended
                : null;
    return framework
      ? {
          ...stylingRecommendation(platform, framework, language),
          turnOutcome: "accepted",
        }
      : keepCurrentTechDecision(frameworkRecommendation(platform, language), language);
  }

  if (draft.includes("Styling recommendation:")) {
    const platform =
      draft.match(/Platform: (.*?) \(confirmed\)/)?.[1] ||
      "Responsive Web/PWA";
    const framework =
      draft.match(/Framework: (.*?) \(confirmed\)/)?.[1] || "Next.js";
    const styling = /\b(css modules|css native|vanilla css)\b/i.test(lastUserMessage)
      ? "CSS Modules"
      : /\btailwind(?: css)?\b/i.test(lastUserMessage) ||
          AFFIRMATIVE.test(lastUserMessage)
        ? "Tailwind CSS"
        : null;
    return styling
      ? {
          ...stateRecommendation(platform, framework, styling, language),
          turnOutcome: "accepted",
        }
      : keepCurrentTechDecision(
          stylingRecommendation(platform, framework, language),
          language
        );
  }

  if (!draft.includes("State recommendation:")) {
    return platformQuestion(language);
  }

  const platform =
    draft.match(/Platform: (.*?) \(confirmed\)/)?.[1] ||
    "Responsive Web/PWA";
  const framework =
    draft.match(/Framework: (.*?) \(confirmed\)/)?.[1] || "Next.js";
  const styling =
    draft.match(/Styling: (.*?) \(confirmed\)/)?.[1] || "Tailwind CSS";
  const state = /\b(context|react context)\b/i.test(lastUserMessage)
    ? "React Context"
    : /\bzustand\b/i.test(lastUserMessage) || AFFIRMATIVE.test(lastUserMessage)
      ? "Zustand"
      : null;
  if (!state) {
    return keepCurrentTechDecision(
      stateRecommendation(platform, framework, styling, language),
      language
    );
  }
  const confirmed = `${platform}; ${framework}; ${styling}; ${state}`;

  return {
    reply: isId
      ? `Tech stack dikonfirmasi: **${confirmed}**. Berikutnya, apakah data cukup disimpan pada satu perangkat atau perlu tersinkronisasi melalui server?`
      : `Tech stack confirmed: **${confirmed}**. Next, should data remain on one device or synchronize through a server?`,
    activeVariable: "techStackCore",
    maturity: "ready",
    draftValue: confirmed,
    draftSource: "mixed",
    missingDimensions: [],
    confirmedUpdates: { techStackCore: confirmed },
    provisionalUpdates: {},
    suggestedReplies: [
      {
        label: isId ? "Satu perangkat" : "One device",
        value: isId
          ? "Data cukup tersimpan pada satu perangkat."
          : "Data only needs to remain on one device.",
        recommended: true,
      },
      {
        label: isId ? "Sinkronisasi server" : "Server sync",
        value: isId
          ? "Data perlu tersinkronisasi melalui server."
          : "Data needs to synchronize through a server.",
      },
    ],
    sessionLanguage: language,
    turnOutcome: "accepted",
  };
}

function frameworkRecommendation(
  platform: string,
  language: SessionLanguage
): OnboardingApiResponse {
  const isId = language === "id";
  const recommendation = platform === "Mobile" ? "React Native" : "Next.js";
  const alternative = platform === "Mobile" ? "Flutter" : "React SPA + Vite";
  return {
    reply: isId
      ? `Platform **${platform}** dikonfirmasi. Untuk framework, saya merekomendasikan **${recommendation}** agar pengembangan cepat dan ekosistemnya matang. Alternatifnya **${alternative}**, tetapi itu menambah trade-off berbeda. Apakah rekomendasi framework ini cocok?`
      : `Platform **${platform}** is confirmed. For the framework, I recommend **${recommendation}** for fast development and a mature ecosystem. **${alternative}** is the alternative with different trade-offs. Does this framework recommendation fit?`,
    activeVariable: "techStackCore",
    maturity: "needs_clarification",
    draftValue: `Platform: ${platform} (confirmed); Framework recommendation: ${recommendation} (awaiting confirmation)`,
    draftSource: "mixed",
    missingDimensions: ["explicit framework confirmation"],
    confirmedUpdates: {},
    provisionalUpdates: {},
    suggestedReplies: [
      {
        label: isId
          ? `Setuju ${recommendation}`
          : `Use ${recommendation}`,
        value: isId
          ? `Ya, gunakan ${recommendation}.`
          : `Yes, use ${recommendation}.`,
        recommended: true,
      },
      {
        label: alternative,
        value: isId
          ? `Saya memilih ${alternative}.`
          : `I prefer ${alternative}.`,
      },
    ],
    sessionLanguage: language,
  };
}

function stylingRecommendation(
  platform: string,
  framework: string,
  language: SessionLanguage
): OnboardingApiResponse {
  const isId = language === "id";
  return {
    reply: isId
      ? `Framework **${framework}** dikonfirmasi. Untuk styling, saya merekomendasikan **Tailwind CSS** karena konsisten dan cepat untuk membangun UI. **CSS Modules** memberi kontrol CSS lebih langsung tetapi lebih banyak kode berulang. Mana yang Anda pilih?`
      : `Framework **${framework}** is confirmed. For styling, I recommend **Tailwind CSS** for consistent and fast UI work. **CSS Modules** offers more direct CSS control but creates more repetitive code. Which do you prefer?`,
    activeVariable: "techStackCore",
    maturity: "needs_clarification",
    draftValue: `Platform: ${platform} (confirmed); Framework: ${framework} (confirmed); Styling recommendation: Tailwind CSS (awaiting confirmation)`,
    draftSource: "mixed",
    missingDimensions: ["explicit styling confirmation"],
    confirmedUpdates: {},
    provisionalUpdates: {},
    suggestedReplies: [
      {
        label: isId ? "Tailwind CSS" : "Tailwind CSS",
        value: isId ? "Gunakan Tailwind CSS." : "Use Tailwind CSS.",
        recommended: true,
      },
      {
        label: "CSS Modules",
        value: isId ? "Gunakan CSS Modules." : "Use CSS Modules.",
      },
    ],
    sessionLanguage: language,
  };
}

function stateRecommendation(
  platform: string,
  framework: string,
  styling: string,
  language: SessionLanguage
): OnboardingApiResponse {
  const isId = language === "id";
  return {
    reply: isId
      ? "Styling dikonfirmasi. Untuk state management, saya merekomendasikan **Zustand** karena ringan dan mudah dipisahkan dari komponen. **React Context** cukup untuk state yang sangat sederhana, tetapi lebih mudah memicu rerender luas. Mana yang dipilih?"
      : "Styling is confirmed. For state management, I recommend **Zustand** because it is lightweight and stays separate from components. **React Context** is sufficient for very simple state but can cause broader rerenders. Which do you prefer?",
    activeVariable: "techStackCore",
    maturity: "needs_clarification",
    draftValue: `Platform: ${platform} (confirmed); Framework: ${framework} (confirmed); Styling: ${styling} (confirmed); State recommendation: Zustand (awaiting confirmation)`,
    draftSource: "mixed",
    missingDimensions: ["explicit state-management confirmation"],
    confirmedUpdates: {},
    provisionalUpdates: {},
    suggestedReplies: [
      {
        label: "Zustand",
        value: isId ? "Gunakan Zustand." : "Use Zustand.",
        recommended: true,
      },
      {
        label: "React Context",
        value: isId ? "Gunakan React Context." : "Use React Context.",
      },
    ],
    sessionLanguage: language,
  };
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
    return createOnboardingFallback(activeVariable, language);
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
