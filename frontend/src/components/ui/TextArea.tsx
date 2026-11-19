import type { TextareaHTMLAttributes } from "react";

import { cx } from "@/lib/cx";

export type TextAreaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id"
> & {
  id: string;
  label: string;
  hint?: string;
  hideLabel?: boolean;
};

export function TextArea({
  id,
  label,
  hint,
  hideLabel = false,
  className,
  ...props
}: TextAreaProps) {
  const hintId = `${id}-hint`;

  return (
    <div>
      <label
        htmlFor={id}
        className={
          hideLabel
            ? "sr-only"
            : "mb-2 block text-sm font-medium text-muted"
        }
      >
        {label}
      </label>

      <textarea
        id={id}
        aria-describedby={hint ? hintId : undefined}
        className={cx(
          "w-full resize-y rounded-xl border border-line bg-ink/70 p-4 text-sm leading-relaxed text-fg outline-none transition-colors duration-200 placeholder:text-faint hover:border-line-strong focus:border-accent",
          className,
        )}
        {...props}
      />

      {hint && (
        <p id={hintId} className="mt-2 text-xs text-faint">
          {hint}
        </p>
      )}
    </div>
  );
}
