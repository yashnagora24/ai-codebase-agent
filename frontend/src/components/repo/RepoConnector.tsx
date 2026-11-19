import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { CheckIcon, GitBranchIcon } from "@/components/ui/icons";

export type RepoConnectorProps = {
  repoUrl: string;
  onUrlChange: (value: string) => void;
  onConnect: () => void;
  repoLoading: boolean;
  repoError: string;
  workspaceId: string | null;
  connectedRepo: string;
};

export function RepoConnector({
  repoUrl,
  onUrlChange,
  onConnect,
  repoLoading,
  repoError,
  workspaceId,
  connectedRepo,
}: RepoConnectorProps) {
  return (
    <SectionCard
      eyebrow="Step 01"
      icon={<GitBranchIcon />}
      title="Connect Repository"
      description="Enter a public GitHub repository URL to analyze its code."
    >
        <div className="min-w-0 flex-1 mb-3">
          <TextField
            id="repo-url"
            label="Repository URL"
            type="url"
            value={repoUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://github.com/username/repository"
            disabled={repoLoading}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

        <Button
          onClick={onConnect}
          disabled={repoLoading || !repoUrl.trim()}
          loading={repoLoading}
          className="w-full"
        >
          {repoLoading ? "Connecting..." : "Connect Repository"}
        </Button>
      </div>

      {repoError && (
        <Alert variant="error" className="mt-3">
          {repoError}
        </Alert>
      )}

      {workspaceId && (
        <div className="mt-4 rounded-xl border border-success/25 bg-success/[0.07] p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-success">
            <CheckIcon className="size-4" />
            Repository Connected
          </p>

          <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-muted">
            {connectedRepo}
          </p>
        </div>
      )}
    </SectionCard>
  );
}
