import type { ReactNode } from "react";

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-ink/40 px-5 py-8 text-center">
      {icon && (
        <span className="mb-3 grid size-10 place-items-center rounded-xl border border-line bg-raised/60 text-faint [&>svg]:size-4">
          {icon}
        </span>
      )}

      <p className="text-sm font-medium text-fg">{title}</p>

      {description && (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
          {description}
        </p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
