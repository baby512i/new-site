import type { ReactNode } from "react";

export interface FeeLine {
  label: string;
  value: string;
  description?: string;
}

interface FeeSummaryProps {
  title?: string;
  lines: FeeLine[];
  totalLabel?: string;
  totalValue?: string;
  footer?: ReactNode;
}

/**
 * Static fee summary panel — no calculations of its own.
 * The owning island composes lines from the platform config + form state.
 * Real numeric estimates only appear after dxra-core-api returns them.
 */
export function FeeSummary({
  title = "Fee summary",
  lines,
  totalLabel,
  totalValue,
  footer,
}: FeeSummaryProps) {
  return (
    <section
      aria-label={title}
      className="grid gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-xs)]"
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Estimate
        </span>
      </header>

      <ul className="grid gap-2">
        {lines.map((line, index) => (
          <li
            key={`${line.label}-${index}`}
            className="flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)]">
                {line.label}
              </p>
              {line.description ? (
                <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-muted)]">
                  {line.description}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 text-sm font-semibold text-[var(--color-text)]">
              {line.value}
            </p>
          </li>
        ))}
      </ul>

      {totalLabel ? (
        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
          <span className="text-sm font-semibold text-[var(--color-text)]">
            {totalLabel}
          </span>
          <span className="text-sm font-semibold text-[var(--color-text)]">
            {totalValue ?? "—"}
          </span>
        </div>
      ) : null}

      {footer ? (
        <p className="text-xs leading-5 text-[var(--color-text-muted)]">{footer}</p>
      ) : null}
    </section>
  );
}
