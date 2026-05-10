import type { FormHTMLAttributes, ReactNode } from "react";

interface FormShellProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  title?: string;
  description?: string;
  rightPanel?: ReactNode;
}

/**
 * Two-column shell where the OUTER element is the `<form>` itself, so any
 * `type="submit"` button rendered inside `rightPanel` (e.g. ActionButton) is
 * still part of the form and reliably triggers `handleSubmit`.
 *
 * Layout:
 * - left card: form sections
 * - right aside: sticky review/summary panel on desktop, stacked on mobile
 *
 * The owning island wires up `onSubmit` for the readiness/action flow.
 */
export function FormShell({
  children,
  title,
  description,
  rightPanel,
  className,
  ...formProps
}: FormShellProps) {
  return (
    <form
      {...formProps}
      noValidate
      className={[
        "grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start xl:gap-8",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="grid min-w-0 gap-5 rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-xs)] sm:p-6">
        {(title || description) && (
          <header className="grid gap-1">
            {title ? (
              <h2 className="text-lg font-semibold tracking-[var(--tracking-heading)] text-[var(--color-text)] sm:text-xl">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-sm leading-[var(--leading-body)] text-[var(--color-text-muted)]">
                {description}
              </p>
            ) : null}
          </header>
        )}
        <div className="grid gap-6">{children}</div>
      </div>

      {rightPanel ? (
        <aside
          className="grid gap-4 xl:sticky xl:top-[calc(var(--header-height)_+_1rem)]"
          aria-label="Create token summary"
        >
          {rightPanel}
        </aside>
      ) : null}
    </form>
  );
}
