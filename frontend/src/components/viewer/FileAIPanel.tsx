"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { SparklesIcon } from "@/components/ui/icons";

export type FileAIPanelProps = {
  fileQuestion: string;
  onFileQuestionChange: (value: string) => void;
  onAnalyzeFile: () => void;
  fileAnalysis: string;
  fileAnalysisLoading: boolean;
  fileAnalysisError: string;
  fileLoading: boolean;
};

export function FileAIPanel({
  fileQuestion,
  onFileQuestionChange,
  onAnalyzeFile,
  fileAnalysis,
  fileAnalysisLoading,
  fileAnalysisError,
  fileLoading,
}: FileAIPanelProps) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <SparklesIcon className="size-4 text-accent" />
        AI File Analysis
      </h3>

      <TextArea
        id="file-question"
        label="Ask something about this file"
        hideLabel
        value={fileQuestion}
        onChange={(event) => onFileQuestionChange(event.target.value)}
        placeholder="Ask something about this file..."
        rows={3}
        className="text-sm"
      />

      <div className="mt-3">
        <Button
          size="sm"
          onClick={onAnalyzeFile}
          disabled={
            fileAnalysisLoading || !fileQuestion.trim() || fileLoading
          }
          loading={fileAnalysisLoading}
        >
          {fileAnalysisLoading ? "Analyzing..." : "Analyze File"}
        </Button>
      </div>

      {fileAnalysisError && (
        <Alert variant="error" className="mt-3">
          {fileAnalysisError}
        </Alert>
      )}

      {fileAnalysis && (
        <div
          aria-live="polite"
          className="mt-4 rounded-xl border border-line bg-ink/50 p-4"
        >
          <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            AI Response
          </h4>

          <div className="md-body text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {fileAnalysis}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
