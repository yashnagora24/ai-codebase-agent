export type LoadingPanelProps = {
  title: string;
};

export function LoadingPanel({ title }: LoadingPanelProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="rise-in rounded-2xl border border-line bg-surface/70 px-5 py-4"
    >
      <div className="flex items-center gap-3">
        <span className="relative flex size-2.5 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent/50" />
          <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
        </span>

        <p className="text-sm text-fg">{title}</p>
      </div>

      <div className="mt-4 space-y-2" aria-hidden="true">
        <div className="skeleton h-2.5 w-3/4 rounded-full" />
        <div className="skeleton h-2.5 w-full rounded-full" />
        <div className="skeleton h-2.5 w-2/3 rounded-full" />
      </div>
    </div>
  );
}
