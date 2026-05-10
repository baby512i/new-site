import type { ReactNode } from "react";
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface SwitchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: ReactNode;
  /** Reason this control is disabled — rendered when present. */
  disabledReason?: string;
  /** Visual emphasis for dangerous switches (e.g. revoke authority). */
  tone?: "default" | "danger";
}

export const SwitchField = forwardRef<HTMLInputElement, SwitchFieldProps>(
  function SwitchField(
    { id, label, description, disabledReason, tone = "default", disabled, className, ...rest },
    ref,
  ) {
    const reasonId = disabledReason ? `${id}-reason` : undefined;
    const descriptionId = description ? `${id}-desc` : undefined;
    const describedBy = [descriptionId, reasonId].filter(Boolean).join(" ") || undefined;

    const toneClass =
      tone === "danger"
        ? "border-[var(--color-danger-border)] bg-[var(--color-danger-soft)]"
        : "border-[var(--color-border)] bg-[var(--card)]";

    return (
      <div
        className={[
          "flex items-start justify-between gap-4 rounded-[var(--radius-lg)] border px-4 py-3 transition-colors",
          toneClass,
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="min-w-0">
          <label
            htmlFor={id}
            className={[
              "text-sm font-medium",
              tone === "danger"
                ? "text-[var(--color-danger-text)]"
                : "text-[var(--color-text)]",
            ].join(" ")}
          >
            {label}
          </label>
          {description ? (
            <p
              id={descriptionId}
              className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]"
            >
              {description}
            </p>
          ) : null}
          {disabledReason ? (
            <p
              id={reasonId}
              className="mt-1 text-xs leading-5 text-[var(--color-warning-text)]"
            >
              {disabledReason}
            </p>
          ) : null}
        </div>

        <span className="relative inline-flex shrink-0 items-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            role="switch"
            disabled={disabled}
            aria-describedby={describedBy}
            className="peer sr-only"
            {...rest}
          />
          <span
            aria-hidden="true"
            className={[
              "block h-6 w-11 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] transition-colors peer-checked:border-[var(--color-brand)] peer-checked:bg-[var(--color-brand)] peer-disabled:opacity-60",
              tone === "danger"
                ? "peer-checked:border-[var(--color-danger)] peer-checked:bg-[var(--color-danger)]"
                : "",
            ].join(" ")}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-0.5 top-1/2 inline-block h-5 w-5 -translate-y-1/2 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-xs)] transition-transform peer-checked:translate-x-5"
          />
        </span>
      </div>
    );
  },
);
