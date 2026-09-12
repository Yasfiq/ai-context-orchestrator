const MERMAID_DIRECTIVE =
  /^(?:flowchart(?:\s+(?:TB|TD|BT|RL|LR))?|graph(?:\s+(?:TB|TD|BT|RL|LR))?|sequenceDiagram|classDiagram(?:-v2)?|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline)\b/i;

export function isMermaidSource(source: string): boolean {
  const firstMeaningfulLine = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstMeaningfulLine
    ? MERMAID_DIRECTIVE.test(firstMeaningfulLine)
    : false;
}

/**
 * Sanitizes Mermaid diagram source code:
 * 1. Normalizes directive line and direction (e.g. FLOWCHART -> flowchart TD)
 * 2. Quotes flowchart/graph node labels that contain syntax-breaking characters like ( ), { }, :
 */
export function sanitizeMermaidSource(source: string): string {
  if (!source || typeof source !== "string") return "";

  const lines = source.split(/\r?\n/);
  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Normalize directive on first non-empty line
    if (cleanedLines.length === 0) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (/^flowchart\s*$/i.test(trimmed)) {
        cleanedLines.push("flowchart TD");
        continue;
      }
      if (/^graph\s*$/i.test(trimmed)) {
        cleanedLines.push("graph TD");
        continue;
      }
      if (/^flowchart\s+(tb|td|bt|rl|lr)\b/i.test(trimmed)) {
        const match = trimmed.match(/^flowchart\s+(tb|td|bt|rl|lr)\b/i);
        cleanedLines.push(`flowchart ${match![1].toUpperCase()}`);
        continue;
      }
      if (/^graph\s+(tb|td|bt|rl|lr)\b/i.test(trimmed)) {
        const match = trimmed.match(/^graph\s+(tb|td|bt|rl|lr)\b/i);
        cleanedLines.push(`graph ${match![1].toUpperCase()}`);
        continue;
      }
      if (/^statediagram(?:-v2)?\b/i.test(trimmed)) {
        cleanedLines.push("stateDiagram-v2");
        continue;
      }
      if (/^sequencediagram\b/i.test(trimmed)) {
        cleanedLines.push("sequenceDiagram");
        continue;
      }
      if (/^classdiagram(?:-v2)?\b/i.test(trimmed)) {
        cleanedLines.push("classDiagram-v2");
        continue;
      }
      if (/^erdiagram\b/i.test(trimmed)) {
        cleanedLines.push("erDiagram");
        continue;
      }
      if (/^gitgraph\b/i.test(trimmed)) {
        cleanedLines.push("gitGraph");
        continue;
      }
    }

    // Sanitize node labels in flowchart/graph lines:
    // e.g. Node[Next.js (App Router)] -> Node["Next.js (App Router)"]
    line = line.replace(/(\b[a-zA-Z0-9_-]+)\s*\[([^\]\n]+)\]/g, (match, nodeId, label) => {
      const trimmedLabel = label.trim();
      if (
        (trimmedLabel.startsWith('"') && trimmedLabel.endsWith('"')) ||
        (trimmedLabel.startsWith("'") && trimmedLabel.endsWith("'"))
      ) {
        return match;
      }
      if (/[():{}[\]<>&/]/.test(trimmedLabel)) {
        const safeText = trimmedLabel.replace(/"/g, "'");
        return `${nodeId}["${safeText}"]`;
      }
      return match;
    });

    cleanedLines.push(line);
  }

  return cleanedLines.join("\n").trim();
}

/**
 * Repairs common LLM fence mistakes without guessing that arbitrary code is Mermaid.
 */
export function normalizeMermaidMarkdown(markdown: string): string {
  const separated = markdown.replace(/(`{3,})(#{1,6}\s+)/g, "$1\n\n$2");
  return separated.replace(
    /(^|\n)(`{3,})([^\n`]*)\r?\n([\s\S]*?)\n?\2(?=\n|$)/g,
    (match, prefix: string, fence: string, rawInfo: string, rawBody: string) => {
      const info = rawInfo.trim();
      const body = rawBody.replace(/\s+$/, "");

      if (/^mermaid(?:\s|$)/i.test(info)) {
        return `${prefix}${fence}mermaid\n${sanitizeMermaidSource(body)}\n${fence}`;
      }

      if (!info && isMermaidSource(body)) {
        return `${prefix}${fence}mermaid\n${sanitizeMermaidSource(body)}\n${fence}`;
      }

      if (isMermaidSource(info)) {
        const combined = `${info}${body ? `\n${body}` : ""}`;
        return `${prefix}${fence}mermaid\n${sanitizeMermaidSource(combined)}\n${fence}`;
      }

      return match;
    }
  );
}

