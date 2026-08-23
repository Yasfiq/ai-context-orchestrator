"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { normalizeMermaidMarkdown } from "@/lib/mermaid-markdown";
import { MermaidDiagram } from "./MermaidDiagram";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  variant?: "document" | "chat";
}

export function MarkdownRenderer({
  content,
  className,
  variant = "document",
}: MarkdownRendererProps) {
  const isChat = variant === "chat";
  const normalizedContent = React.useMemo(
    () => normalizeMermaidMarkdown(content),
    [content]
  );

  return (
    <div className={cn("prose-zen min-w-0 break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className={cn("font-semibold tracking-tight text-foreground", isChat ? "mb-3 mt-5 text-lg" : "mb-6 mt-12 border-b border-border pb-4 text-3xl md:text-4xl")}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={cn("font-semibold tracking-tight text-foreground", isChat ? "mb-2 mt-4 text-base" : "mb-4 mt-10 text-2xl")}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={cn("font-semibold text-foreground", isChat ? "mb-2 mt-4 text-sm" : "mb-3 mt-8 text-lg")}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className={cn("text-foreground/90", isChat ? "mb-3 text-sm leading-7" : "mb-5 text-[15px] leading-8")}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className={cn("ml-5 list-disc text-foreground/90 marker:text-indigo-300", isChat ? "mb-3 space-y-1 text-sm" : "mb-5 space-y-2 text-[15px]")}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className={cn("ml-5 list-decimal text-foreground/90 marker:font-mono marker:text-indigo-300", isChat ? "mb-3 space-y-1 text-sm" : "mb-5 space-y-2 text-[15px]")}>
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName && !String(children).includes("\n");
            if (isInline) {
              return (
                <code className="border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.82em] text-indigo-100">
                  {children}
                </code>
              );
            }
            return (
              <code
                className={cn(
                  "block min-w-max bg-transparent p-5 font-mono text-xs leading-6 text-foreground/90",
                  codeClassName
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => {
            const child = React.Children.toArray(children)[0];
            if (React.isValidElement<{ className?: string; children?: React.ReactNode }>(child)) {
              const language = /language-([^\s]+)/.exec(child.props.className || "")?.[1];
              if (language === "mermaid") {
                return <MermaidDiagram source={String(child.props.children).trim()} />;
              }
            }

            return (
              <pre className={cn("overflow-x-auto border-y border-border bg-[#0d1114]", isChat ? "mb-3" : "mb-6")}>
                {children}
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="mb-6 border-l-2 border-primary bg-primary/[0.035] px-5 py-4 text-sm leading-7 text-muted-foreground [&>p]:mb-0">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="mb-7 overflow-x-auto border-y border-border" tabIndex={0} aria-label="Tabel dokumen, geser secara horizontal jika diperlukan">
              <table className="w-full min-w-[620px] border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-r border-border bg-surface px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-r border-border px-4 py-3 align-top leading-6 text-foreground/85">
              {children}
            </td>
          ),
          hr: () => <hr className="my-10 border-border" />,
          a: ({ children, href }) => (
            <a
              href={href}
              className="break-all text-indigo-300 underline decoration-indigo-400/50 underline-offset-4 transition-colors hover:text-indigo-200 focus-visible:text-indigo-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/80">{children}</em>
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
