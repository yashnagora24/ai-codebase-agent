import type { AIResponse } from "@/lib/types";

import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { ChartIcon, CpuIcon, FolderIcon, TerminalIcon } from "@/components/ui/icons";

export type AnalysisStatsProps = {
  result: AIResponse;
};

export function AnalysisStats({ result }: AnalysisStatsProps) {
  return (
    <SectionCard
      eyebrow="Metrics"
      icon={<ChartIcon />}
      title="Repository Statistics"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile
          label="Files Analyzed"
          value={result.files_analyzed}
          icon={<FolderIcon />}
        />

        <StatTile
          label="Repository Size"
          value={`${((result.total_bytes ?? 0) / 1024).toFixed(2)} KB`}
          icon={<CpuIcon />}
        />
      </div>

      {result.truncated && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-[11px] leading-relaxed text-warning">
          <TerminalIcon className="mt-0.5 size-3.5 shrink-0" />
          Note: Some repository content was truncated.
        </p>
      )}
    </SectionCard>
  );
}
