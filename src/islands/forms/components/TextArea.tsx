import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ invalid = false, className, rows = 4, ...rest }, ref) {
    const baseClass =
      "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm leading-[var(--leading-body)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-colors focus-visible:outline-none focus-visible:border-[var(--ring)] focus-visible:ring-2 focus-visible:ring-[var(--ring-soft)] disabled:cursor-not-allowed disabled:opacity-60";
    const invalidClass = invalid
      ? "border-[var(--danger)] focus-visible:border-[var(--danger)]"
      : "";
    return (
      <textarea
        ref={ref}
        rows={rows}
        {...rest}
        aria-invalid={invalid ? "true" : undefined}
        className={[baseClass, invalidClass, className ?? ""]
          .filter(Boolean)
          .join(" ")}
      />
    );
  },
);
