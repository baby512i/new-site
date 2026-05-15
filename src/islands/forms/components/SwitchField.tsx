import type { ReactNode } from "react";
import { forwardRef, useId } from "react";

export type SwitchFieldBadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "pro"
  | "warning";

export interface SwitchFieldBadge {
  label: string;
  tone?: SwitchFieldBadgeTone;
}

export interface SwitchFieldProps {
  id?: string;
  label: string;
  description?: ReactNode;
  badge?: SwitchFieldBadge;
  disabledReason?: string;
  tone?: "default" | "warning";
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
}

const badgeToneClass: Record<SwitchFieldBadgeTone, string> = {
  neutral:
    "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
  brand:
    "border-[var(--color-brand-border)] bg-[var(--color-brand-soft)] text-[var(--color-brand-text)]",
  success:
    "border-[var(--color-success-border)] bg-[var(--color-success-soft)] text-[var(--color-success-text)]",
  pro: "border-[var(--color-pro-border)] bg-[var(--color-pro-soft)] text-[var(--color-pro-text)]",
  warning:
    "border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] text-[var(--color-warning-text)]",
};

export const SwitchField = forwardRef<HTMLButtonElement, SwitchFieldProps>(
  function SwitchField(
    {
      id: idProp,
      label,
      description,
      badge,
      disabledReason,
      tone = "default",
      disabled = false,
      checked,
      onCheckedChange,
      onBlur,
      className,
    },
    ref,
  ) {
    const autoId = useId();
    const switchId = idProp ?? autoId.replace(/:/g, "");
    const labelId = `${switchId}-label`;
    const reasonId = disabledReason ? `${switchId}-reason` : undefined;
    const descriptionId = description ? `${switchId}-desc` : undefined;
    const describedBy = [descriptionId, reasonId].filter(Boolean).join(" ") || undefined;
    const isOn = Boolean(checked);

    const cardClass =
      tone === "warning" && isOn
        ? "border-[var(--color-warning-border)] bg-[var(--color-warning-soft)]"
        : "border-[var(--color-border)] bg-[var(--color-surface-muted)]";

    const trackClass = isOn
      ? tone === "warning"
        ? "border-[var(--color-switch-track-on-warning-border)] bg-[var(--color-switch-track-on-warning)]"
        : "border-[var(--color-switch-track-on-border)] bg-[var(--color-switch-track-on)]"
      : "border-[var(--color-switch-track-off-border)] bg-[var(--color-switch-track-off)]";

    return (
      <div
        className={[
          "flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border px-4 py-3",
          cardClass,
          disabled ? "opacity-60" : "",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <label
              id={labelId}
              htmlFor={switchId}
              className={[
                "cursor-pointer text-sm font-medium leading-[var(--leading-title)]",
                tone === "warning" && isOn
                  ? "text-[var(--color-warning-text)]"
                  : "text-[var(--color-text)]",
                disabled ? "cursor-not-allowed" : "",
              ].join(" ")}
            >
              {label}
            </label>
            {badge ? (
              <span
                className={[
                  "inline-flex items-center rounded-[var(--radius-sm)] border px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                  badgeToneClass[badge.tone ?? "neutral"],
                ].join(" ")}
              >
                {badge.label}
              </span>
            ) : null}
          </div>
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

        <button
          ref={ref}
          id={switchId}
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          disabled={disabled}
          onBlur={onBlur}
          onClick={() => {
            if (disabled) return;
            onCheckedChange(!isOn);
          }}
          className={[
            "relative flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-soft)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-muted)]",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
            trackClass,
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className={[
              "pointer-events-none block h-5 w-5 shrink-0 rounded-full bg-[var(--color-switch-thumb)] shadow-[var(--shadow-switch-thumb)]",
              "transition-[margin] duration-150",
              isOn ? "ms-auto" : "",
            ].join(" ")}
          />
        </button>
      </div>
    );
  },
);
