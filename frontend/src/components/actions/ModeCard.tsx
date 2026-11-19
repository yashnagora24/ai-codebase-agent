import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

export type ModeCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
};

export function ModeCard({
  title,
  description,
  icon,
  selected,
  disabled,
  onClick,
}: ModeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cx(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-accent/50 bg-accent/[0.07] shadow-[inset_0_1px_0_rgba(34,211,238,0.15)]"
          : "border-line bg-ink/40 hover:border-line-strong hover:bg-raised/50",
      )}
    >
      <span
        className={cx(
          "grid size-8 shrink-0 place-items-center rounded-lg border transition-colors duration-200 [&>svg]:size-4",
          selected
            ? "border-accent/30 bg-accent/10 text-accent"
            : "border-line bg-raised/60 text-faint",
        )}
      >
        {icon}
      </span>

      <span className="min-w-0">
        <span
          className={cx(
            "block text-sm font-semibold",
            selected ? "text-accent" : "text-fg",
          )}
        >
          {title}
        </span>

        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
          {description}
        </span>
      </span>
    </button>
  );
}
