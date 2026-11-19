"use client";

import { useEffect, useRef, useState } from "react";

import { cx } from "@/lib/cx";
import { Button } from "./Button";
import { CheckIcon, CopyIcon } from "./icons";

const RESET_MS = 2000;

export type CopyButtonProps = {
  /**
   * Performs the copy. Return `false` to signal failure so the success
   * state is not shown. Anything else (including `void`) counts as success.
   */
  onCopy: () => boolean | void | Promise<boolean | void>;
  disabled?: boolean;
  variant?: "secondary" | "inline";
  className?: string;
};

export function CopyButton({
  onCopy,
  disabled = false,
  variant = "secondary",
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy() {
    const failed = (await onCopy()) === false;

    if (failed) return;

    setCopied(true);

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(() => setCopied(false), RESET_MS);
  }

  const iconClass = variant === "inline" ? "size-3" : "size-3.5";

  const content = (
    <>
      {copied ? (
        <CheckIcon className={cx(iconClass, "text-success")} />
      ) : (
        <CopyIcon className={iconClass} />
      )}
      <span aria-live="polite">{copied ? "Copied!" : "Copy"}</span>
    </>
  );

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleCopy}
        disabled={disabled}
        className={cx(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-ink/70 px-2.5 py-1 text-[11px] text-muted transition-colors duration-200 hover:border-line-strong hover:text-fg disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={handleCopy}
      disabled={disabled}
      className={className}
    >
      {content}
    </Button>
  );
}
