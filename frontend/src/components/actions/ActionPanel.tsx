import type { KeyboardEventHandler } from "react";

import type { Mode } from "@/lib/types";

import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextArea } from "@/components/ui/TextArea";
import { RadarIcon, SparklesIcon, WrenchIcon } from "@/components/ui/icons";
import { ModeCard } from "./ModeCard";

export type ActionPanelProps = {
  mode: Mode;
  question: string;
  loading: boolean;
  workspaceId: string | null;
  onSelectAsk: () => void;
  onSelectFix: () => void;
  onAnalyze: () => void;
  onQuestionChange: (value: string) => void;
  onQuestionKeyDown: KeyboardEventHandler<HTMLTextAreaElement>;
  onSubmit: () => void;
};

export function ActionPanel({
  mode,
  question,
  loading,
  workspaceId,
  onSelectAsk,
  onSelectFix,
  onAnalyze,
  onQuestionChange,
  onQuestionKeyDown,
  onSubmit,
}: ActionPanelProps) {
  return (
    <SectionCard
      eyebrow="Step 03"
      icon={<SparklesIcon />}
      title="Choose an action"
      description="Ask about the codebase, hunt a bug, or run a full repository analysis."
    >
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <ModeCard
          title="Ask AI"
          description="Ask questions about your code"
          icon={<SparklesIcon />}
          selected={mode === "ask"}
          disabled={loading}
          onClick={onSelectAsk}
        />

        <ModeCard
          title="Suggest Fix"
          description="Find bugs and suggest solutions"
          icon={<WrenchIcon />}
          selected={mode === "fix"}
          disabled={loading}
          onClick={onSelectFix}
        />
      </div>

      <button
        type="button"
        onClick={onAnalyze}
        disabled={loading || !workspaceId}
        className="mb-5 flex w-full cursor-pointer items-center gap-3 rounded-xl border border-violet/25 bg-violet/[0.07] p-3.5 text-left transition-colors duration-200 hover:border-violet/40 hover:bg-violet/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-violet/25 bg-violet/10 text-violet [&>svg]:size-4">
          <RadarIcon />
        </span>

        <span className="min-w-0">
          <span className="block text-sm font-semibold text-violet">
            Analyze Repository →
          </span>

          <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
            Get a complete AI analysis of your codebase
          </span>
        </span>
      </button>

      <TextArea
        id="question"
        label={
          mode === "ask"
            ? "Ask a question about your codebase"
            : "Describe the bug"
        }
        value={question}
        onChange={(event) => onQuestionChange(event.target.value)}
        onKeyDown={onQuestionKeyDown}
        placeholder={
          mode === "ask"
            ? "Example: Where is repository scanning handled?"
            : "Example: My /read-file endpoint returns HTTP 400. find the cause and suggest a fix."
        }
        rows={4}
        spellCheck={false}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] text-faint">
          Press Enter to submit · Shift + Enter for a new line
        </p>

        <Button onClick={onSubmit} disabled={loading} loading={loading}>
          {loading ? "Processing..." : mode === "ask" ? "Ask AI →" : "Suggest Fix →"}
        </Button>
      </div>
    </SectionCard>
  );
}
