import type { ButtonHTMLAttributes } from "react";

import { cx } from "@/lib/cx";
import { LoaderIcon } from "./icons";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "violet";
type Size = "sm" | "md";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-ink shadow-[0_10px_30px_-14px_rgba(34,211,238,0.9)] hover:bg-accent-strong",
  secondary:
    "border border-line bg-raised/60 text-fg hover:border-line-strong hover:bg-raised",
  ghost: "text-muted hover:bg-raised hover:text-fg",
  danger:
    "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15",
  violet:
    "border border-violet/25 bg-violet/10 text-violet hover:bg-violet/15",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-5 py-3 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  type = "button",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <LoaderIcon className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
