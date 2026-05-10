import type { ReactNode } from "react";

interface FormSectionProps {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  /** Optional element rendered to the right of the title (e.g. "Step 2 of 5"). */
  meta?: ReactNode;
}

export function FormSection({
  id,
  title,
  description,
  children,
  meta,
}: FormSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className="grid gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            id={id ? `${id}-title` : undefined}
            className="text-base font-semibold leading-[var(--leading-title)] text-[var(--color-text)]"
          >
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-sm leading-[var(--leading-body)] text-[var(--color-text-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {meta ? (
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            {meta}
          </span>
        ) : null}
      </header>

      <div className="grid gap-4">{children}</div>
    </section>
  );
}
