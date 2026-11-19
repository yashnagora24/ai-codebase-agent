import type { AIResponse } from "@/lib/types";

import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  ChevronRightIcon,
  FileCodeIcon,
  ListIcon,
  TerminalIcon,
} from "@/components/ui/icons";

export type RelevantFilesProps = {
  result: AIResponse;
  onOpenFile: (file: string) => void;
};

export function RelevantFiles({ result, onOpenFile }: RelevantFilesProps) {
  return (
    <SectionCard
      eyebrow="Context"
      icon={<ListIcon />}
      title="Relevant Files"
      description={`${result.files_analyzed} files included in AI context`}
    >
      {(result.relevant_files ?? []).length > 0 ? (
        <ul className="space-y-1.5">
          {(result.relevant_files ?? []).map((file) => (
            <li key={file}>
              <button
                type="button"
                onClick={() => onOpenFile(file)}
                className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border border-line/70 bg-ink/40 px-3 py-2.5 text-left transition-colors duration-200 hover:border-accent/40 hover:bg-raised/60"
              >
                <FileCodeIcon className="size-4 shrink-0 text-faint transition-colors group-hover:text-accent" />

                <span className="min-w-0 flex-1 break-all font-mono text-[12px] leading-relaxed text-muted transition-colors group-hover:text-fg">
                  {file}
                </span>

                <ChevronRightIcon className="size-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<FileCodeIcon />}
          title="No relevant files were returned."
          description="Try rephrasing the question or connecting a repository first."
        />
      )}

      {result.truncated && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-[11px] leading-relaxed text-warning">
          <TerminalIcon className="mt-0.5 size-3.5 shrink-0" />
          Note: Some repository content was truncated.
        </p>
      )}
    </SectionCard>
  );
}
