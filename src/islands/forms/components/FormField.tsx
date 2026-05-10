import type { ReactNode } from "react";
import { FieldError } from "./FieldError";
import { HelpText } from "./HelpText";

interface FormFieldProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  /** Description rendered ABOVE the input. Use sparingly — prefer hint below. */
  description?: ReactNode;
  error?: string;
  /** Reason a disabled field is not editable. Shown when present. */
  disabledReason?: string;
  children: ReactNode;
}

/**
 * Standard field wrapper:
 * - <label> + required marker on top
 * - children (input)
 * - hint OR error below
 * - disabled reason callout below if present
 */
export function FormField({
  htmlFor,
  label,
  required = false,
  optional = false,
  hint,
  description,
  error,
  disabledReason,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const reasonId = disabledReason ? `${htmlFor}-reason` : undefined;

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-[var(--color-text)]"
        >
          {label}
          {required ? (
            <span
              className="ml-1 text-[var(--color-danger-text)]"
              aria-hidden="true"
            >
              *
            </span>
          ) : null}
          {optional ? (
            <span className="ml-1 text-xs font-normal text-[var(--color-text-muted)]">
              (optional)
            </span>
          ) : null}
        </label>
      </div>

      {description ? (
        <p className="text-xs leading-5 text-[var(--color-text-muted)]">
          {description}
        </p>
      ) : null}

      {children}

      {error ? (
        <FieldError id={errorId} message={error} />
      ) : hint ? (
        <HelpText id={hintId}>{hint}</HelpText>
      ) : null}

      {disabledReason ? (
        <HelpText id={reasonId} tone="warning">
          {disabledReason}
        </HelpText>
      ) : null}
    </div>
  );
}
