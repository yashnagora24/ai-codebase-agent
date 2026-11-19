import { LogoIcon } from "@/components/ui/icons";

export type TopBarProps = {
  workspaceId: string | null;
  connectedRepo: string;
};

export function TopBar({ workspaceId, connectedRepo }: TopBarProps) {
  const isConnected = Boolean(workspaceId);

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-accent/25 bg-gradient-to-br from-accent/20 via-accent/5 to-violet/10 text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <LogoIcon className="size-5" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                AI Codebase <span className="text-accent">Agent</span>
              </h1>

              <span className="hidden rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-accent sm:inline-block">
                AI-Powered Developer Tool
              </span>
            </div>

            <p className="mt-0.5 truncate text-xs text-muted">
              Understand your codebase. Find files. Fix bugs.
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
              isConnected
                ? "border-success/30 bg-success/10 text-success"
                : "border-line bg-raised/60 text-muted"
            }`}
          >
            <span
              className={`size-1.5 shrink-0 rounded-full ${
                isConnected
                  ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.9)]"
                  : "bg-faint"
              }`}
            />

            {isConnected ? (
              <span className="truncate font-mono text-[11px]" title={connectedRepo}>
                {connectedRepo}
              </span>
            ) : (
              <span>No repository connected</span>
            )}
          </span>
        </div>
      </div>
    </header>
  );
}
