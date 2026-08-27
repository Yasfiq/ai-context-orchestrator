/**
 * Anti-Slop Engine & Polish Layer
 * Eliminates AI cliches, buzzwords, and conversational filler
 * while guaranteeing 100% preservation of Mermaid diagrams, code fences, inline code, and URLs.
 */

export interface AntiSlopOptions {
  preserveCodeBlocks?: boolean;
}

export interface AntiSlopMatch {
  pattern: string;
  count: number;
}

export interface SlopScoreResult {
  score: number; // 0 = pristine technical prose, >0 = slop detected
  slopCount: number;
  wordCount: number;
  matches: AntiSlopMatch[];
}

/**
 * High-frequency AI cliches and buzzwords with technical, concise replacements.
 */
interface ReplacementRule {
  pattern: RegExp;
  replacement: string | ((match: string, ...args: unknown[]) => string);
  description: string;
}

const FILLER_PHRASE_RULES: ReplacementRule[] = [
  // Conversational filler & LLM preambles / intros
  {
    pattern: /(?:^|\n)(?:In conclusion|To sum up|In summary|All in all),?\s+/gim,
    replacement: "\n",
    description: "Conclusion filler preamble",
  },
  {
    pattern: /(?:^|\n)(?:Kesimpulannya|Sebagai kesimpulan|Secara keseluruhan),?\s+/gim,
    replacement: "\n",
    description: "Indonesian conclusion filler",
  },
  {
    pattern: /(?:It is|It's)\s+(?:crucial|important|vital|essential)\s+to\s+(?:note|remember|keep in mind)\s+that\s+/gi,
    replacement: "Note: ",
    description: "Wordy note preamble",
  },
  {
    pattern: /(?:Perlu|Penting untuk)\s+(?:diingat|dicatat|diketahui)\s+bahwa\s+/gi,
    replacement: "Catatan: ",
    description: "Indonesian wordy note preamble",
  },
  {
    pattern: /(?:In today's|In the modern)\s+(?:fast-paced|ever-evolving|digital)\s+(?:world|landscape|era),?\s+/gi,
    replacement: "In production, ",
    description: "Fast-paced world cliché",
  },
  {
    pattern: /Di\s+era\s+(?:digital\s+yang\s+serba\s+cepat|modern\s+ini),?\s+/gi,
    replacement: "Pada arsitektur sistem, ",
    description: "Indonesian digital era cliché",
  },
  {
    pattern: /(?:Without further ado|Without much ado),?\s+/gi,
    replacement: "",
    description: "Without further ado cliché",
  },
  {
    pattern: /(?:As an AI|As a large language model)[^.\n]*[.\n]/gi,
    replacement: "",
    description: "Self-referencing AI text",
  },
  {
    pattern: /(?:Sebagai model bahasa|Sebagai AI)[^.\n]*[.\n]/gi,
    replacement: "",
    description: "Indonesian self-referencing AI text",
  },
];

const BILINGUAL_WORD_RULES: ReplacementRule[] = [
  // English Jargon & Buzzwords
  {
    pattern: /\bdelve(?:\s+deeply)?\s+into\b/gi,
    replacement: "examine",
    description: "delve into",
  },
  {
    pattern: /\bdelves\s+into\b/gi,
    replacement: "examines",
    description: "delves into",
  },
  {
    pattern: /\bdelving\s+into\b/gi,
    replacement: "examining",
    description: "delving into",
  },
  {
    pattern: /\bdelve\b/gi,
    replacement: "explore",
    description: "delve",
  },
  {
    pattern: /\bseamlessly\s+integrate(?:s|d)?\b/gi,
    replacement: "integrates directly",
    description: "seamlessly integrate",
  },
  {
    pattern: /\bseamlessly\b/gi,
    replacement: "directly",
    description: "seamlessly",
  },
  {
    pattern: /\bseamless\b/gi,
    replacement: "integrated",
    description: "seamless",
  },
  {
    pattern: /\brevolutionize(?:s|d)?\b/gi,
    replacement: "modernize",
    description: "revolutionize",
  },
  {
    pattern: /\brevolutionizing\b/gi,
    replacement: "modernizing",
    description: "revolutionizing",
  },
  {
    pattern: /\bgame-?changer\b/gi,
    replacement: "core capability",
    description: "game-changer",
  },
  {
    pattern: /\ba\s+rich\s+tapestry\s+of\b/gi,
    replacement: "a structured set of",
    description: "rich tapestry of",
  },
  {
    pattern: /\btapestry\s+of\b/gi,
    replacement: "collection of",
    description: "tapestry of",
  },
  {
    pattern: /\bbeacon\s+of\b/gi,
    replacement: "standard for",
    description: "beacon of",
  },
  {
    pattern: /\bfoster(?:s|ed|ing)?\b/gi,
    replacement: "enable",
    description: "foster",
  },
  {
    pattern: /\bplethora\s+of\b/gi,
    replacement: "multiple",
    description: "plethora of",
  },
  {
    pattern: /\bin\s+the\s+realm\s+of\b/gi,
    replacement: "in",
    description: "in the realm of",
  },
  {
    pattern: /\bsupercharge(?:s|d)?\b/gi,
    replacement: "accelerate",
    description: "supercharge",
  },
  {
    pattern: /\bsupercharging\b/gi,
    replacement: "accelerating",
    description: "supercharging",
  },
  {
    pattern: /\ba\s+testament\s+to\b/gi,
    replacement: "evidence of",
    description: "a testament to",
  },
  {
    pattern: /\btestament\s+to\b/gi,
    replacement: "reflects",
    description: "testament to",
  },
  {
    pattern: /\bharness(?:ing|es|ed)?\s+the\s+power\s+of\b/gi,
    replacement: "using",
    description: "harness the power of",
  },

  // Indonesian Jargon & Buzzwords
  {
    pattern: /\bmerevolusi\b/gi,
    replacement: "memodernisasi",
    description: "merevolusi",
  },
  {
    pattern: /\btanpa\s+hambatan\b/gi,
    replacement: "terintegrasi langsung",
    description: "tanpa hambatan",
  },
  {
    pattern: /\bmenyelami\s+lebih\s+dalam\b/gi,
    replacement: "menganalisis",
    description: "menyelami lebih dalam",
  },
  {
    pattern: /\bmenyelami\b/gi,
    replacement: "membahas",
    description: "menyelami",
  },
  {
    pattern: /\btak\s+tertandingi\b/gi,
    replacement: "optimal",
    description: "tak tertandingi",
  },
  {
    pattern: /\bmerangkul\s+teknologi\b/gi,
    replacement: "mengadopsi teknologi",
    description: "merangkul teknologi",
  },
  {
    pattern: /\bujung\s+tombak\b/gi,
    replacement: "komponen utama",
    description: "ujung tombak",
  },
];

const ALL_RULES = [...FILLER_PHRASE_RULES, ...BILINGUAL_WORD_RULES];

/**
 * Isolates code blocks, mermaid blocks, inline code, and URLs to prevent
 * deterministic substitutions from modifying valid technical syntax.
 */
export function cleanAntiSlop(text: string): string {
  if (!text || typeof text !== "string") return "";

  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];
  const urls: string[] = [];

  // 1. Protect multi-line code blocks & mermaid diagrams
  let protectedText = text.replace(
    /(^|\n)(`{3,})([^\n`]*)\r?\n([\s\S]*?)\n?\2(?=\n|$)/g,
    (match) => {
      const index = codeBlocks.length;
      codeBlocks.push(match);
      return `\n__CODE_BLOCK_PLACEHOLDER_${index}__\n`;
    }
  );

  // 2. Protect inline code `...`
  protectedText = protectedText.replace(/`([^`\n]+)`/g, (match) => {
    const index = inlineCodes.length;
    inlineCodes.push(match);
    return `__INLINE_CODE_PLACEHOLDER_${index}__`;
  });

  // 3. Protect URLs (both in markdown link targets and raw URLs)
  protectedText = protectedText.replace(
    /https?:\/\/[^\s)\]]+/gi,
    (match) => {
      const index = urls.length;
      urls.push(match);
      return `__URL_PLACEHOLDER_${index}__`;
    }
  );

  // 4. Apply anti-slop cleaning rules on narrative markdown
  for (const rule of ALL_RULES) {
    if (typeof rule.replacement === "function") {
      protectedText = protectedText.replace(rule.pattern, rule.replacement as (...args: unknown[]) => string);
    } else {
      protectedText = protectedText.replace(rule.pattern, rule.replacement);
    }
  }

  // Clean redundant blank lines created by removal
  protectedText = protectedText.replace(/\n{3,}/g, "\n\n");

  // 5. Restore URLs
  protectedText = protectedText.replace(
    /__URL_PLACEHOLDER_(\d+)__/g,
    (_, indexStr) => {
      const index = parseInt(indexStr, 10);
      return urls[index] ?? "";
    }
  );

  // 6. Restore inline code
  protectedText = protectedText.replace(
    /__INLINE_CODE_PLACEHOLDER_(\d+)__/g,
    (_, indexStr) => {
      const index = parseInt(indexStr, 10);
      return inlineCodes[index] ?? "";
    }
  );

  // 7. Restore code blocks & mermaid diagrams
  protectedText = protectedText.replace(
    /\n*__CODE_BLOCK_PLACEHOLDER_(\d+)__\n*/g,
    (_, indexStr) => {
      const index = parseInt(indexStr, 10);
      return codeBlocks[index] ?? "";
    }
  );

  return protectedText.trim();
}

/**
 * Calculates a quantitative Slop Score to measure text fluff.
 * Useful for automated assertions and QA audits.
 */
export function calculateSlopScore(text: string): SlopScoreResult {
  if (!text || typeof text !== "string") {
    return { score: 0, slopCount: 0, wordCount: 0, matches: [] };
  }

  // Remove code blocks and URLs before scoring
  const narrativeOnly = text
    .replace(/(^|\n)(`{3,})([^\n`]*)\r?\n([\s\S]*?)\n?\2(?=\n|$)/g, "")
    .replace(/`([^`\n]+)`/g, "")
    .replace(/https?:\/\/[^\s)\]]+/gi, "");

  const words = narrativeOnly.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount === 0) {
    return { score: 0, slopCount: 0, wordCount: 0, matches: [] };
  }

  const matches: AntiSlopMatch[] = [];
  let totalSlopCount = 0;

  for (const rule of ALL_RULES) {
    const hits = narrativeOnly.match(rule.pattern);
    if (hits && hits.length > 0) {
      matches.push({
        pattern: rule.description,
        count: hits.length,
      });
      totalSlopCount += hits.length;
    }
  }

  // Slop Score = (slop instances / total words) * 1000
  const score = Number(((totalSlopCount / wordCount) * 1000).toFixed(2));

  return {
    score,
    slopCount: totalSlopCount,
    wordCount,
    matches,
  };
}
