import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ActionButtonState =
  | "idle"
  | "incomplete"
  | "wallet-required"
  | "ready"
  | "preparing"
  | "signing"
  | "submitting"
  | "success"
  | "error";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  state: ActionButtonState;
  children: ReactNode;
  /** Optional helper line below the button (e.g. error reason). */
  helper?: string;
  /** Tone override for special cases — defaults to brand primary. */
  tone?: "primary" | "danger";
}

const stateBusy: ReadonlyArray<ActionButtonState> = [
  "preparing",
  "signing",
  "submitting",
];

export function ActionButton({
  state,
  children,
  helper,
  tone = "primary",
  className,
  ...rest
}: ActionButtonProps) {
  const busy = stateBusy.includes(state);
  const disabled = rest.disabled || busy;

  const toneClass =
    tone === "danger"
      ? "bg-[var(--danger)] text-[var(--color-text-inverse)] hover:brightness-95"
      : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]";

  return (
    <div className="grid gap-1.5">
      <button
        type="submit"
        {...rest}
        aria-busy={busy ? "true" : undefined}
        disabled={disabled}
        className={[
          "inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-transparent px-5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:border-[var(--ring)] focus-visible:ring-2 focus-visible:ring-[var(--ring-soft)] disabled:pointer-events-none disabled:opacity-55",
          "min-h-[var(--control-lg)]",
          toneClass,
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {busy ? (
          <span
            aria-hidden="true"
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : null}
        <span className="truncate">{children}</span>
      </button>
      {helper ? (
        <p
          className={[
            "text-xs leading-5",
            state === "error"
              ? "text-[var(--color-danger-text)]"
              : "text-[var(--color-text-muted)]",
          ].join(" ")}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}
