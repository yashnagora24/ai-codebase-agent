import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

type Tone = "neutral" | "accent" | "success" | "violet" | "warning";

export type BadgeProps = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
};

const tones: Record<Tone, string> = {
  neutral: "border-line bg-raised/70 text-muted",
  accent: "border-accent/25 bg-accent/10 text-accent",
  success: "border-success/25 bg-success/10 text-success",
  violet: "border-violet/25 bg-violet/10 text-violet",
  warning: "border-warning/25 bg-warning/10 text-warning",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
