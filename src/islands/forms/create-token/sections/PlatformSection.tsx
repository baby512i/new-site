import { FormSection } from "../../components/FormSection";
import type { CreateTokenPlatformConfig } from "../../../../lib/tool-config/create-token-platforms";

interface PlatformSectionProps {
  id: string;
  platform: CreateTokenPlatformConfig;
}

/**
 * Read-only banner showing the active platform. The crawlable platform switch
 * lives in the static Astro page above this island, not inside the form, so
 * each platform keeps its own URL.
 */
export function PlatformSection({ id, platform }: PlatformSectionProps) {
  return (
    <FormSection
      id={id}
      title="Selected platform"
      description="Each platform has its own dedicated page so the URL stays shareable. Use the platform selector above to switch."
      meta={platform.shortLabel}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm">
        <div className="min-w-0">
          <p className="font-semibold text-[var(--color-text)]">
            {platform.label}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
            {platform.feeSummary}
          </p>
        </div>
        <a
          href="#create-token-platform-nav-heading"
          className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-semibold text-[var(--color-brand-text)] hover:border-[var(--color-brand-border)] hover:bg-[var(--color-brand-soft)]"
        >
          Change platform
        </a>
      </div>
    </FormSection>
  );
}
