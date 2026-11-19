"use client";

import type { ReactNode } from "react";
// @ts-expect-error react-syntax-highlighter does not provide TypeScript declarations.
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// @ts-expect-error react-syntax-highlighter does not provide TypeScript declarations for Prism styles.
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import { getFileLanguage } from "@/lib/format";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { SectionCard } from "@/components/ui/SectionCard";
import { FileCodeIcon, XIcon } from "@/components/ui/icons";

export type CodeViewerProps = {
  selectedFile: string;
  fileContent: string;
  fileLoading: boolean;
  fileError: string;
  fileSize: number;
  onCopy: () => boolean | void | Promise<boolean | void>;
  onClose: () => void;
  children: ReactNode;
};

export function CodeViewer({
  selectedFile,
  fileContent,
  fileLoading,
  fileError,
  fileSize,
  onCopy,
  onClose,
  children,
}: CodeViewerProps) {
  return (
    <SectionCard
      eyebrow="Viewer"
      icon={<FileCodeIcon />}
      title="File Viewer"
      description={
        <span className="mt-1 block break-all font-mono text-[11px] text-accent">
          {selectedFile}
        </span>
      }
      bodyClassName="px-4 py-4 sm:px-5"
      actions={
        <>
          <CopyButton
            onCopy={onCopy}
            disabled={fileLoading || !fileContent}
          />

          <Button size="sm" variant="ghost" onClick={onClose}>
            <XIcon className="size-3.5" />
            Close
          </Button>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone="accent">{getFileLanguage(selectedFile).toUpperCase()}</Badge>
        <Badge>{`${(fileSize / 1024).toFixed(2)} KB`}</Badge>
      </div>

      {fileLoading ? (
        <div className="space-y-2" role="status" aria-busy="true">
          <p className="text-sm text-muted">Loading file...</p>
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-11/12 rounded" />
          <div className="skeleton h-4 w-4/5 rounded" />
          <div className="skeleton h-4 w-2/3 rounded" />
        </div>
      ) : fileError ? (
        <p className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">
          {fileError}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          <SyntaxHighlighter
            language={getFileLanguage(selectedFile)}
            style={vscDarkPlus}
            showLineNumbers={true}
            wrapLongLines={true}
            customStyle={{
              margin: 0,
              padding: "16px",
              background: "#030712",
              fontSize: "13px",
              maxHeight: "600px",
              borderRadius: "8px",
            }}
            lineNumberStyle={{
              color: "#64748b",
              minWidth: "3em",
              paddingRight: "1em",
            }}
          >
            {fileContent}
          </SyntaxHighlighter>
        </div>
      )}

      <div className="mt-6 border-t border-line pt-6">{children}</div>
    </SectionCard>
  );
}
