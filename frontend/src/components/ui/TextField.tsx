import type { InputHTMLAttributes } from "react";

import { cx } from "@/lib/cx";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({
  id,
  label,
  hint,
  error,
  className,
  ...props
}: TextFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-faint"
      >
        {label}
      </label>

      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={cx(error && errorId, hint && hintId) || undefined}
        className={cx(
          "w-full rounded-xl border border-line bg-ink/70 px-4 py-3 text-sm text-fg outline-none transition-colors duration-200 placeholder:text-faint hover:border-line-strong focus:border-accent disabled:opacity-50",
          className,
        )}
        {...props}
      />

      {hint && !error && (
        <p id={hintId} className="mt-2 text-xs text-faint">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
