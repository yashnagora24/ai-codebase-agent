import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

type SectionCardProps = {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function SectionCard({
  title,
  description,
  eyebrow,
  icon,
  actions,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  return (
    <section
      className={cx(
        "rounded-2xl border border-line bg-surface/80 shadow-[0_24px_60px_-40px_rgba(2,8,20,0.9)] backdrop-blur-sm",
        "rise-in",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/70 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-raised/70 text-accent [&>svg]:size-4">
              {icon}
            </span>
          )}

          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
                {eyebrow}
              </p>
            )}

            <h2 className="text-[0.95rem] font-semibold tracking-tight text-white">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>

      <div className={cx("px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}
