import type { ScanResponse } from "@/lib/types";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { FolderIcon, ScanIcon } from "@/components/ui/icons";
import { FileRow } from "./FileRow";

export type FileExplorerProps = {
  scanResult: ScanResponse | null;
  scanLoading: boolean;
  workspaceId: string | null;
  onScan: () => void;
  onOpenFile: (file: string) => void;
};

export function FileExplorer({
  scanResult,
  scanLoading,
  workspaceId,
  onScan,
  onOpenFile,
}: FileExplorerProps) {
  return (
    <SectionCard
      eyebrow="Step 02"
      icon={<FolderIcon />}
      title="File Explorer"
      description="Scan your GitHub repository and browse its files."
      bodyClassName="px-3 pb-3 pt-3"
      actions={
        <Button
          size="sm"
          variant="secondary"
          onClick={onScan}
          disabled={!workspaceId || scanLoading}
          loading={scanLoading}
        >
          {scanLoading ? "Scanning..." : "Scan Repository"}
        </Button>
      }
    >
      {scanLoading && !scanResult ? (
        <div className="space-y-2 px-2 py-1" aria-hidden="true">
          <div className="skeleton h-9 rounded-lg" />
          <div className="skeleton h-9 rounded-lg" />
          <div className="skeleton h-9 rounded-lg" />
          <div className="skeleton h-9 rounded-lg" />
        </div>
      ) : scanResult ? (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-2 font-mono text-[11px] text-faint">
            <p>
              Total Files:{" "}
              <span className="text-accent">{scanResult.total_files_found}</span>
            </p>
            <p>
              Showing:{" "}
              <span className="text-accent">{scanResult.results_returned}</span>
            </p>
          </div>

          <div className="max-h-[26rem] space-y-1.5 overflow-y-auto pr-1">
            {scanResult.files.map((file) => (
              <FileRow
                key={file.path}
                path={file.path}
                extension={file.extension}
                onClick={() => onOpenFile(file.path)}
              />
            ))}
          </div>

          {scanResult.truncated && (
            <p className="mt-3 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-[11px] leading-relaxed text-warning">
              Some files are not displayed because of the scan limit.
            </p>
          )}
        </div>
      ) : (
        <div className="px-1 pb-1">
          <EmptyState
            icon={<ScanIcon />}
            title="No files scanned yet"
            description={
              workspaceId
                ? "Run a scan to list the files in this repository."
                : "Connect a GitHub repository first, then run a scan."
            }
          />
        </div>
      )}
    </SectionCard>
  );
}
