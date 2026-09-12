import type { MermaidConfig } from "mermaid";
import { sanitizeMermaidSource } from "./mermaid-markdown";

const MERMAID_CONFIG: MermaidConfig = {
  startOnLoad: false,
  securityLevel: "strict",
  suppressErrorRendering: true,
  theme: "base",
  themeVariables: {
    background: "#121619",
    primaryColor: "#4338CA",
    primaryTextColor: "#E2E8F0",
    primaryBorderColor: "#6366F1",
    secondaryColor: "#10B981",
    secondaryTextColor: "#121619",
    secondaryBorderColor: "#059669",
    tertiaryColor: "#1C2328",
    tertiaryTextColor: "#E2E8F0",
    tertiaryBorderColor: "#334155",
    lineColor: "#94A3B8",
    textColor: "#E2E8F0",
    mainBkg: "#1C2328",
    nodeBorder: "#6366F1",
    clusterBkg: "#171C20",
    clusterBorder: "#334155",
    edgeLabelBackground: "#121619",
    noteBkgColor: "#1C2328",
    noteTextColor: "#E2E8F0",
    noteBorderColor: "#10B981",
    git0: "#4338CA",
    git1: "#10B981",
    git2: "#F59E0B",
    git3: "#38BDF8",
    gitBranchLabel0: "#E2E8F0",
    gitBranchLabel1: "#121619",
  },
  flowchart: { htmlLabels: false, useMaxWidth: true },
  sequence: { useMaxWidth: true, wrap: true },
};

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;

async function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize(MERMAID_CONFIG);
      return mermaid;
    });
  }

  return mermaidPromise;
}

export async function renderMermaidSvg(
  id: string,
  source: string
): Promise<string> {
  const mermaid = await getMermaid();
  const sanitized = sanitizeMermaidSource(source);
  const { svg } = await mermaid.render(id, sanitized);
  return svg;
}
