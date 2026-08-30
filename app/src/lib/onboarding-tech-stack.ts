import type {
  OnboardingApiResponse,
  OnboardingInputSource,
  SessionLanguage,
} from "@/types/schema";

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
