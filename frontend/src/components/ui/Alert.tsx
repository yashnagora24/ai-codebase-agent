import type { ReactNode } from "react";

import { cx } from "@/lib/cx";
import { AlertIcon, CheckIcon } from "./icons";

type Variant = "error" | "warning" | "info" | "success";

export type AlertProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

const variants: Record<Variant, string> = {
  error: "border-danger/30 bg-danger/10 text-danger",
  warning: "border-warning/30 bg-warning/10 text-warning",
  info: "border-accent/25 bg-accent/10 text-accent",
  success: "border-success/30 bg-success/10 text-success",
};

export function Alert({ children, variant = "info", className }: AlertProps) {
  const Icon = variant === "success" ? CheckIcon : AlertIcon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cx(
        "rise-in flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        variants[variant],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}
