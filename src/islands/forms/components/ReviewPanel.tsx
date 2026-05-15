import type { ReactNode } from "react";

export interface ReviewItem {
  label: string;
  value: ReactNode;
  /** Marks the row visually as risky/important (e.g. permanent action). */
  warn?: boolean;
}

interface ReviewPanelProps {
  title?: string;
  items: ReviewItem[];
  /** Small square preview of the token image (object URL from parent). */
  tokenImagePreviewUrl?: string | null;
  footer?: ReactNode;
}

export function ReviewPanel({
  title = "Review before signing",
  items,
  tokenImagePreviewUrl,
  footer,
}: ReviewPanelProps) {
  return (
    <section
      aria-label={title}
      className="grid gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-xs)]"
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Live
        </span>
      </header>

      {tokenImagePreviewUrl ? (
        <div className="flex items-center gap-2.5">
          <img
            src={tokenImagePreviewUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-border)] object-cover"
          />
          <span className="text-xs font-medium text-[var(--color-text-muted)]">
            Token image
          </span>
        </div>
      ) : null}

      <dl className="grid gap-2">
        {items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="flex items-start justify-between gap-3 border-b border-dashed border-[var(--color-border)] pb-2 last:border-b-0 last:pb-0"
          >
            <dt
              className={[
                "text-xs font-medium uppercase tracking-[0.08em]",
                item.warn
                  ? "text-[var(--color-warning-text)]"
                  : "text-[var(--color-text-muted)]",
              ].join(" ")}
            >
              {item.label}
            </dt>
            <dd
              className={[
                "max-w-[60%] truncate text-right text-sm font-semibold",
                item.warn
                  ? "text-[var(--color-warning-text)]"
                  : "text-[var(--color-text)]",
              ].join(" ")}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      {footer ? <div>{footer}</div> : null}
    </section>
  );
}
