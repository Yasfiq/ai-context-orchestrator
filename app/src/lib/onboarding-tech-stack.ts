/**
 * Tech-Stack onboarding flow state machine.
 *
 * Domain problem
 * --------------
 * The onboarding flow walks the user through four sequential decisions:
 *   Platform -> Framework -> Styling -> State-management
 * Previously this state was threaded between turns by serializing a
 * `draftValue` string and parsing it back with regex inside
 * `createTechStackGuidance`. That is a state machine hiding in a string:
 * the control flow is encoded in the wording of `draftValue`, which is
 * fragile, hard to test, and hard to extend.
 *
 * This module replaces that with an explicit, structured `TechStackProgress`
 * type: `parseDraft` reads the legacy `draftValue` string into typed fields,
 * and the step logic dispatches on `next` instead of string-matching wording.
 * The legacy string remains the wire format to the store, but is only ever
 * written by the recommendation builders, never parsed ad-hoc.
 */

import type {
  OnboardingApiResponse,
  OnboardingInputSource,
  SessionLanguage,
  SuggestedReply,
} from "@/types/schema";

export type TechPlatform = "Mobile" | "Desktop" | "Responsive Web/PWA";
export type TechStackStep = "platform" | "framework" | "styling" | "state";

export interface TechStackField {
  value: string | null;
  confirmed: boolean;
}

export interface TechStackProgress {
  platform: TechStackField;
  framework: TechStackField;
  styling: TechStackField;
  state: TechStackField;
  /** The step currently awaiting user confirmation. */
  next: TechStackStep;
}

const FIELD_ORDER: TechStackStep[] = ["platform", "framework", "styling", "state"];

const AFFIRMATIVE =
  /^\s*(?:ya|iya|setuju|cocok|oke|ok|lanjut|pilih itu|gunakan(?: rekomendasi(?: itu)?)?|yes|agree|sounds good|use it)[.!]?\s*$/i;
const UNSURE =
  /\b(tidak tahu|belum tahu|belum yakin|terserah|rekomendasikan|not sure|don't know|do not know|recommend)\b/i;

export type PlatformChoice = TechPlatform;

/** ---- Legacy string parsing / serialization shim ---- */

// Each confirmed field reads: "<Label>: <value> (confirmed)"
// Each pending  field reads: "<Label> recommendation: <value> (awaiting confirmation)"
function fieldConfirmedRegExp(label: string): RegExp {
  return new RegExp(`${label}: (.+?) \\(confirmed\\)`);
}
function fieldPendingRegExp(label: string): RegExp {
  return new RegExp(`${label} recommendation: (.+?) \\(awaiting confirmation\\)`);
}

function parseField(draft: string, label: string): TechStackField {
  const confirmed = draft.match(fieldConfirmedRegExp(label));
  if (confirmed) return { value: confirmed[1], confirmed: true };
  const pending = draft.match(fieldPendingRegExp(label));
  if (pending) return { value: pending[1], confirmed: false };
  return { value: null, confirmed: false };
}

/**
 * Parse a legacy serialized `draftValue` into a structured progress object.
 * Returns null for drafts that are not produced by this flow.
 */
export function parseDraft(draft: string | null): TechStackProgress | null {
  if (!draft) return null;
  const normalized = draft.trim();
  const isStructuredDraft =
    /(?:Platform|Framework|Styling|State) (?:recommendation|:)/.test(normalized);
  if (!isStructuredDraft) return null;

  const platform = parseField(normalized, "Platform");
  const framework = parseField(normalized, "Framework");
  const styling = parseField(normalized, "Styling");
  const state = parseField(normalized, "State");

  const progress: TechStackProgress = {
    platform,
    framework,
    styling,
    state,
    next: "platform",
  };

  const next =
    FIELD_ORDER.find(
      (step) => !fieldFor(progress, step).confirmed && fieldFor(progress, step).value !== null
    ) ??
    FIELD_ORDER.find((step) => !fieldFor(progress, step).confirmed) ??
    "platform";

  progress.next = next;
  return progress;
}

function fieldFor(progress: TechStackProgress, step: TechStackStep): TechStackField {
  return progress[step];
}

/** ---- Helpers ---- */

function platformFromPlatformChoice(choice: PlatformChoice): TechPlatform {
  // normalize explicit-web mentions -> Responsive Web/PWA
  if (choice === "Mobile") return "Mobile";
  if (choice === "Desktop") return "Desktop";
  return "Responsive Web/PWA";
}

export function classifyPlatformChoice(message: string): PlatformChoice | null {
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

function recommendedFramework(platform: TechPlatform): string {
  return platform === "Mobile" ? "React Native" : "Next.js";
}

function platformRecommendation(language: SessionLanguage): OnboardingApiResponse {
  const isId = language === "id";
  const reply = isId
    ? "Saya merekomendasikan **web responsif/PWA** lebih dulu: satu aplikasi dapat dibuka di HP dan laptop tanpa proses instalasi store. Trade-off-nya, notifikasi background tidak sekuat aplikasi mobile native. Apakah platform web/PWA cocok?"
    : "I recommend a **responsive web app/PWA** first: one application works on phones and laptops without an app-store installation. The trade-off is weaker background notifications than a native mobile app. Does web/PWA fit?";
  return {
    reply,
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

function toPlatform(value: string): TechPlatform {
  return value === "Mobile" || value === "Desktop"
    ? value
    : "Responsive Web/PWA";
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

function frameworkRecommendation(platform: TechPlatform, language: SessionLanguage): OnboardingApiResponse {
  const isId = language === "id";
  const recommendation = recommendedFramework(platform);
  const alternative = platform === "Mobile" ? "Flutter" : "React SPA + Vite";
  const reply = isId
    ? `Platform **${platform}** dikonfirmasi. Untuk framework, saya merekomendasikan **${recommendation}** agar pengembangan cepat dan ekosistemnya matang. Alternatifnya **${alternative}**, tetapi itu menambah trade-off berbeda. Apakah rekomendasi framework ini cocok?`
    : `Platform **${platform}** is confirmed. For the framework, I recommend **${recommendation}** for fast development and a mature ecosystem. **${alternative}** is the alternative with different trade-offs. Does this framework recommendation fit?`;
  return {
    reply,
    activeVariable: "techStackCore",
    maturity: "needs_clarification",
    draftValue: `Platform: ${platform} (confirmed); Framework recommendation: ${recommendation} (awaiting confirmation)`,
    draftSource: "mixed",
    missingDimensions: ["explicit framework confirmation"],
    confirmedUpdates: {},
    provisionalUpdates: {},
    suggestedReplies: [
      {
        label: isId ? `Setuju ${recommendation}` : `Use ${recommendation}`,
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
  platform: TechPlatform,
  framework: string,
  language: SessionLanguage
): OnboardingApiResponse {
  const isId = language === "id";
  const reply = isId
    ? `Framework **${framework}** dikonfirmasi. Untuk styling, saya merekomendasikan **Tailwind CSS** karena konsisten dan cepat untuk membangun UI. **CSS Modules** memberi kontrol CSS lebih langsung tetapi lebih banyak kode berulang. Mana yang Anda pilih?`
    : `Framework **${framework}** is confirmed. For styling, I recommend **Tailwind CSS** for consistent and fast UI work. **CSS Modules** offers more direct CSS control but creates more repetitive code. Which do you prefer?`;
  return {
    reply,
    activeVariable: "techStackCore",
    maturity: "needs_clarification",
    draftValue: `Platform: ${platform} (confirmed); Framework: ${framework} (confirmed); Styling recommendation: Tailwind CSS (awaiting confirmation)`,
    draftSource: "mixed",
    missingDimensions: ["explicit styling confirmation"],
    confirmedUpdates: {},
    provisionalUpdates: {},
    suggestedReplies: [
      {
        label: "Tailwind CSS",
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
  platform: TechPlatform,
  framework: string,
  styling: string,
  language: SessionLanguage
): OnboardingApiResponse {
  const isId = language === "id";
  const reply = isId
    ? "Styling dikonfirmasi. Untuk state management, saya merekomendasikan **Zustand** karena ringan dan mudah dipisahkan dari komponen. **React Context** cukup untuk state yang sangat sederhana, tetapi lebih mudah memicu rerender luas. Mana yang dipilih?"
    : "Styling is confirmed. For state management, I recommend **Zustand** because it is lightweight and stays separate from components. **React Context** is sufficient for very simple state but can cause broader rerenders. Which do you prefer?";
  return {
    reply,
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
  const parsed = parseDraft(existingDraft);

  // Case: no existing draft, user unsure -> recommend platform
  if (!parsed) {
    const directPlatform = classifyPlatformChoice(lastUserMessage);
    if (!directPlatform) {
      return UNSURE.test(lastUserMessage)
        ? platformRecommendation(language)
        : platformQuestion(language);
    }
    return {
      ...frameworkRecommendation(platformFromPlatformChoice(directPlatform), language),
      turnOutcome: "accepted",
    };
  }

  // Existing structured progress -> drive the FSM based on `next` step.
  const { platform, framework, styling, state, next } = parsed;

  if (next === "platform") {
    // Awaiting platform confirmation
    if (AFFIRMATIVE.test(lastUserMessage)) {
      const confirmed: TechPlatform = "Responsive Web/PWA";
      return {
        ...frameworkRecommendation(confirmed, language),
        turnOutcome: "accepted",
      };
    }
    const chosen = classifyPlatformChoice(lastUserMessage);
    return chosen
      ? {
          ...frameworkRecommendation(platformFromPlatformChoice(chosen), language),
          turnOutcome: "accepted",
        }
      : keepCurrentTechDecision(platformRecommendation(language), language);
  }

  if (next === "framework") {
    const confirmedPlatform = toPlatform(platform.value ?? "Responsive Web/PWA");
    const recommended = recommendedFramework(confirmedPlatform);
    // Original semantics: alternatives resolve per platform, non-mobile
    // alternative text uses "React SPA with Vite".
    const alt = confirmedPlatform === "Mobile" ? "Flutter" : "React SPA with Vite";
    let chosenFramework: string | null = null;
    if (confirmedPlatform === "Mobile" && /\bflutter\b/i.test(lastUserMessage)) {
      chosenFramework = alt;
    } else if (confirmedPlatform === "Mobile" && /\breact native\b/i.test(lastUserMessage)) {
      chosenFramework = recommended;
    } else if (confirmedPlatform !== "Mobile" && /\b(vite|react spa)\b/i.test(lastUserMessage)) {
      chosenFramework = alt;
    } else if (confirmedPlatform !== "Mobile" && /\bnext\.?js\b/i.test(lastUserMessage)) {
      chosenFramework = recommended;
    } else if (AFFIRMATIVE.test(lastUserMessage)) {
      chosenFramework = recommended;
    }
    if (chosenFramework) {
      return {
        ...stylingRecommendation(confirmedPlatform, chosenFramework, language),
        turnOutcome: "accepted",
      };
    }
    return keepCurrentTechDecision(frameworkRecommendation(confirmedPlatform, language), language);
  }

  if (next === "styling") {
    const confirmedPlatform = toPlatform(platform.value ?? "Responsive Web/PWA");
    const confirmedFramework = framework.value ?? "Next.js";
    if (/(css modules|css native|vanilla css)\b/i.test(lastUserMessage)) {
      return { ...stateRecommendation(confirmedPlatform, confirmedFramework, "CSS Modules", language), turnOutcome: "accepted" };
    }
    if (/tailwind/i.test(lastUserMessage) || AFFIRMATIVE.test(lastUserMessage)) {
      return { ...stateRecommendation(confirmedPlatform, confirmedFramework, "Tailwind CSS", language), turnOutcome: "accepted" };
    }
    return keepCurrentTechDecision(stylingRecommendation(confirmedPlatform, confirmedFramework, language), language);
  }

  // next === "state"
  // Original fallbacks: absent confirmed fields default to the recommended
  // values so the final confirmation always round-trips.
  const confirmedPlatform = toPlatform(platform.value ?? "Responsive Web/PWA");
  const confirmedFramework = framework.value ?? "Next.js";
  const confirmedStyling = styling.value ?? "Tailwind CSS";
  const finalState = /\b(context|react context)\b/i.test(lastUserMessage)
    ? "React Context"
    : /\bzustand\b/i.test(lastUserMessage) || AFFIRMATIVE.test(lastUserMessage)
    ? "Zustand"
    : null;

  if (!finalState) {
    return keepCurrentTechDecision(stateRecommendation(confirmedPlatform, confirmedFramework, confirmedStyling, language), language);
  }

  const confirmedStack = `${confirmedPlatform}; ${confirmedFramework}; ${confirmedStyling}; ${finalState}`;
  const reply =
    language === "id"
      ? `Tech stack dikonfirmasi: **${confirmedStack}**. Berikutnya, apakah data cukup disimpan pada satu perangkat atau perlu tersinkronisasi melalui server?`
      : `Tech stack confirmed: **${confirmedStack}**. Next, should data remain on one device or synchronize through a server?`;
  return {
    reply,
    activeVariable: "techStackCore",
    maturity: "ready",
    draftValue: confirmedStack,
    draftSource: "mixed",
    missingDimensions: [],
    confirmedUpdates: { techStackCore: confirmedStack },
    provisionalUpdates: {},
    suggestedReplies: [
      {
        label: language === "id" ? "Satu perangkat" : "One device",
        value: language === "id" ? "Data cukup tersimpan pada satu perangkat." : "Data only needs to remain on one device.",
        recommended: true,
      },
      {
        label: language === "id" ? "Sinkronisasi server" : "Server sync",
        value: language === "id" ? "Data perlu tersinkronisasi melalui server." : "Data needs to synchronize through a server.",
      },
    ],
    sessionLanguage: language,
    turnOutcome: "accepted",
  };
}
