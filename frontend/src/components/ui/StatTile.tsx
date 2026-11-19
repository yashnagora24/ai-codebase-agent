import type { ReactNode } from "react";

type StatTileProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
};

export function StatTile({ label, value, icon }: StatTileProps) {
  return (
    <div className="rounded-xl border border-line bg-ink/50 p-4 transition-colors duration-200 hover:border-line-strong">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
          {label}
        </p>

        {icon && (
          <span className="text-faint [&>svg]:size-3.5">{icon}</span>
        )}
      </div>

      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-accent">
        {value}
      </p>
    </div>
  );
}
