const MERMAID_DIRECTIVE = /^(?:flowchart\s+(?:TB|TD|BT|RL|LR)|graph\s+(?:TB|TD|BT|RL|LR)|sequenceDiagram|classDiagram(?:-v2)?|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline)\b/;

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
 * Repairs common LLM fence mistakes without guessing that arbitrary code is Mermaid.
 */
export function normalizeMermaidMarkdown(markdown: string): string {
  return markdown.replace(
    /(^|\n)(`{3,})([^\n`]*)\r?\n([\s\S]*?)\n?\2(?=\n|$)/g,
    (match, prefix: string, fence: string, rawInfo: string, rawBody: string) => {
      const info = rawInfo.trim();
      const body = rawBody.replace(/\s+$/, "");

      if (/^mermaid(?:\s|$)/i.test(info)) {
        return `${prefix}${fence}mermaid\n${body}\n${fence}`;
      }

      if (!info && isMermaidSource(body)) {
        return `${prefix}${fence}mermaid\n${body}\n${fence}`;
      }

      if (isMermaidSource(info)) {
        return `${prefix}${fence}mermaid\n${info}${body ? `\n${body}` : ""}\n${fence}`;
      }

      return match;
    }
  );
}

