"use client";

import * as React from "react";
import { renderMermaidSvg } from "@/lib/mermaid-client";
import { Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";

interface MermaidDiagramProps {
  source: string;
}

type RenderState =
  | { status: "loading"; svg: "" }
  | { status: "rendered"; svg: string }
  | { status: "error"; svg: "" };

export function MermaidDiagram({ source }: MermaidDiagramProps) {
  const reactId = React.useId();
  const [state, setState] = React.useState<RenderState>({
    status: "loading",
    svg: "",
  });
  const [sourceVisible, setSourceVisible] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [renderAttempt, setRenderAttempt] = React.useState(0);
  const diagramId = React.useMemo(
    () => `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [reactId]
  );

  React.useEffect(() => {
    let active = true;
    setState({ status: "loading", svg: "" });

    renderMermaidSvg(diagramId, source)
      .then((svg) => {
        if (active) setState({ status: "rendered", svg });
      })
      .catch(() => {
        if (active) setState({ status: "error", svg: "" });
      });

    return () => {
      active = false;
    };
  }, [diagramId, source, renderAttempt]);

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access may be unavailable in restricted browser contexts.
    }
  };

  const diagramType = source.trim().split(/\s+/)[0] || "diagram";
  const diagramLabel = `Diagram proyek dengan format ${diagramType}`;

  return (
    <figure className="mermaid-shell" data-testid="mermaid-diagram">
      {state.status === "loading" && (
        <div className="mermaid-status" role="status">
          Menyusun tampilan diagram...
        </div>
      )}

      {state.status === "rendered" && (
        <div
          className="mermaid-canvas"
          role="img"
          aria-label={diagramLabel}
          dangerouslySetInnerHTML={{ __html: state.svg }}
        />
      )}

      {state.status === "error" && (
        <div className="mermaid-error" role="alert">
          Diagram belum dapat ditampilkan. Periksa sintaks atau lihat kode diagram sebagai fallback.
        </div>
      )}

      <div className="mermaid-actions">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {diagramType}
        </span>
        <div className="flex items-center gap-2">
          {state.status === "error" && (
            <button type="button" onClick={() => setRenderAttempt((value) => value + 1)}>
              <RefreshCw className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
              Coba render ulang
            </button>
          )}
          <button type="button" onClick={() => setSourceVisible((value) => !value)}>
            {sourceVisible ? (
              <EyeOff className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Eye className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
            )}
            {sourceVisible ? "Sembunyikan kode" : "Lihat kode"}
          </button>
          <button type="button" onClick={copySource} aria-live="polite">
            {copied ? (
              <Check className="mr-1.5 inline h-3.5 w-3.5 text-success" aria-hidden="true" />
            ) : (
              <Copy className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? "Tersalin" : "Salin kode"}
          </button>
        </div>
      </div>

      {sourceVisible && (
        <pre className="mermaid-source">
          <code>{source}</code>
        </pre>
      )}
    </figure>
  );
}
