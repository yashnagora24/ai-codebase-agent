"use client";

import { isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

import { extractText } from "@/lib/format";
import { CopyButton } from "@/components/ui/CopyButton";

export type MarkdownContentProps = {
  content: string;
  onCopyCode: (code: string) => boolean | void | Promise<boolean | void>;
};

export function MarkdownContent({ content, onCopyCode }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        pre: ({ children }) => {
          const code = extractText(children);

          const languageClass = isValidElement(children)
            ? (children.props as { className?: string }).className
            : undefined;

          const language = languageClass?.match(/language-([\w-]+)/)?.[1];

          const languageLabel = language
            ? language.charAt(0).toUpperCase() + language.slice(1)
            : "Code";

          return (
            <div className="relative my-4 overflow-hidden rounded-xl border border-line">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-raised/80 px-4 py-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
                  {languageLabel}
                </span>

                <CopyButton
                  variant="inline"
                  onCopy={() => onCopyCode(code)}
                />
              </div>

              <pre className="overflow-x-auto bg-ink/80 p-4 text-[13px] leading-relaxed">
                {children}
              </pre>
            </div>
          );
        },

        code: ({ children, className, ...props }) => {
          const isCodeBlock = Boolean(className);

          return (
            <code
              className={
                isCodeBlock
                  ? className
                  : "rounded bg-raised px-1.5 py-0.5 font-mono text-[0.85em] text-accent"
              }
              {...props}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
