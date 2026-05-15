import { useEffect, type ReactNode } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { CreatorInfoFields } from "../fields/CreatorInfoFields";
import { VanityAddressFields } from "../fields/VanityAddressFields";
import { clearAdvancedOptionFields } from "../utils/reset-conditional-fields";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";

interface AdvancedOptionsSectionProps {
  id: string;
  form: UseFormReturn<CreateTokenValues>;
}

function AdvancedSubsection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
      <header className="grid gap-1">
        <h3 className="text-sm font-semibold leading-[var(--leading-title)] text-[var(--color-text)]">
          {title}
        </h3>
        <p className="text-xs leading-5 text-[var(--color-text-muted)]">
          {description}
        </p>
      </header>
      {children}
    </div>
  );
}

function AdvancedOptionsChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {expanded ? (
        <path d="M6 9l6 6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}

export function AdvancedOptionsSection({ id, form }: AdvancedOptionsSectionProps) {
  const { control, watch } = form;
  const includeAdvancedOptions = watch("includeAdvancedOptions" as never);
  const panelId = `${id}-panel`;

  useEffect(() => {
    if (!includeAdvancedOptions) {
      clearAdvancedOptionFields(form);
    }
  }, [form, includeAdvancedOptions]);

  return (
    <section id={id} className="grid gap-4">
      <Controller
        name={"includeAdvancedOptions" as never}
        control={control}
        render={({ field }) => (
          <button
            type="button"
            id={`${id}-trigger`}
            aria-expanded={Boolean(field.value)}
            aria-controls={panelId}
            onClick={() => field.onChange(!field.value)}
            onBlur={field.onBlur}
            className={[
              "flex w-full min-h-[var(--control-lg)] items-center justify-between gap-3",
              "rounded-[var(--radius-xl)] border border-[var(--color-border)]",
              "bg-[var(--color-surface-muted)] px-4 py-3 sm:px-5",
              "text-left text-sm font-medium text-[var(--color-text)]",
              "hover:border-[var(--color-brand-border)] hover:bg-[var(--color-nav-hover)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-soft)]",
            ].join(" ")}
          >
            <span>Advanced Options</span>
            <AdvancedOptionsChevron expanded={Boolean(field.value)} />
          </button>
        )}
      />

      {includeAdvancedOptions ? (
        <div id={panelId} role="region" aria-labelledby={`${id}-trigger`} className="grid gap-5">
          <AdvancedSubsection
            title="Creator info"
            description="Optional project or team details stored in token metadata."
          >
            <CreatorInfoFields form={form} />
          </AdvancedSubsection>

          <AdvancedSubsection
            title="Custom address generator"
            description="Optional vanity mint address pattern. Generation runs only when you start it."
          >
            <VanityAddressFields form={form} showHeading={false} />
          </AdvancedSubsection>
        </div>
      ) : null}
    </section>
  );
}
