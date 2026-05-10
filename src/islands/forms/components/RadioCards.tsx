import type { ReactNode } from "react";

interface RadioCardOption<TValue extends string> {
  value: TValue;
  label: string;
  description?: ReactNode;
  badge?: string;
  disabled?: boolean;
}

interface RadioCardsProps<TValue extends string> {
  name: string;
  legend?: string;
  value: TValue;
  options: ReadonlyArray<RadioCardOption<TValue>>;
  onChange: (value: TValue) => void;
  columns?: 1 | 2 | 3;
}

export function RadioCards<TValue extends string>({
  name,
  legend,
  value,
  options,
  onChange,
  columns = 1,
}: RadioCardsProps<TValue>) {
  const gridClass =
    columns === 3
      ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      : columns === 2
        ? "grid gap-3 sm:grid-cols-2"
        : "grid gap-3";

  return (
    <fieldset className="grid gap-2">
      {legend ? (
        <legend className="text-sm font-medium text-[var(--color-text)]">
          {legend}
        </legend>
      ) : null}

      <div role="radiogroup" aria-label={legend} className={gridClass}>
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const checked = option.value === value;

          return (
            <label
              key={option.value}
              htmlFor={id}
              className={[
                "group flex h-full cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border px-3 py-3 text-sm transition-colors",
                checked
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-text)]"
                  : "border-[var(--color-border)] bg-[var(--card)] text-[var(--color-text)] hover:border-[var(--color-border-strong)]",
                option.disabled ? "cursor-not-allowed opacity-60" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                disabled={option.disabled}
                onChange={(e) => {
                  if (option.disabled) return;
                  if (e.currentTarget.checked) {
                    onChange(option.value);
                  }
                }}
                className="peer sr-only"
              />

              <span
                aria-hidden="true"
                className={[
                  "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  checked
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                    : "border-[var(--color-border-strong)] bg-[var(--color-surface)]",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span
                  className={[
                    "h-2.5 w-2.5 rounded-full bg-[var(--color-brand)]",
                    checked ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                />
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{option.label}</span>
                  {option.badge ? (
                    <span className="rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">
                      {option.badge}
                    </span>
                  ) : null}
                </span>
                {option.description ? (
                  <span className="text-xs leading-5 text-[var(--color-text-muted)]">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
