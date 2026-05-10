import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Optional inline suffix (e.g. "bps", "decimals"). Read-only display. */
  suffix?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    { invalid = false, suffix, className, type = "text", ...rest },
    ref,
  ) {
    const baseClass =
      "w-full min-h-[var(--control-md)] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-colors focus-visible:outline-none focus-visible:border-[var(--ring)] focus-visible:ring-2 focus-visible:ring-[var(--ring-soft)] disabled:cursor-not-allowed disabled:opacity-60";
    const invalidClass = invalid
      ? "border-[var(--danger)] focus-visible:border-[var(--danger)]"
      : "";

    if (!suffix) {
      return (
        <input
          ref={ref}
          type={type}
          {...rest}
          aria-invalid={invalid ? "true" : undefined}
          className={[baseClass, invalidClass, className ?? ""]
            .filter(Boolean)
            .join(" ")}
        />
      );
    }

    return (
      <div
        className={[
          "flex items-stretch overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] focus-within:border-[var(--ring)] focus-within:ring-2 focus-within:ring-[var(--ring-soft)]",
          invalid ? "border-[var(--danger)]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          ref={ref}
          type={type}
          {...rest}
          aria-invalid={invalid ? "true" : undefined}
          className={[
            "min-h-[var(--control-md)] flex-1 bg-transparent px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
            className ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
        <span className="inline-flex items-center border-l border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-xs font-medium text-[var(--color-text-muted)]">
          {suffix}
        </span>
      </div>
    );
  },
);
