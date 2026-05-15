import { FormSection } from "../../components/FormSection";
import type { CreateTokenActionFlowState } from "../utils/get-action-readiness";

interface ReviewCreateSectionProps {
  id: string;
  actionState: CreateTokenActionFlowState;
}

/**
 * Final form section: explanatory note + success/error callouts.
 *
 * The actual ReviewPanel + FeeSummary + ActionButton live in the right-side
 * sticky panel (see `CreateTokenForm`'s `rightPanel` slot). This section keeps
 * inline status feedback close to where the user is reading.
 */
export function ReviewCreateSection({
  id,
  actionState,
}: ReviewCreateSectionProps) {
  return (
    <FormSection
      id={id}
      title="Review & create"
      description="Use the right-side panel to review every value. The action button connects your wallet only when you click it."
    >
      <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-xs leading-5 text-[var(--color-text-muted)]">
        Wallet is required only for the final signing step. dxra-core-api builds
        the unsigned transaction first; your wallet then signs and submits it.
        We never custody funds.
      </p>

      {actionState.stage === "success" ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-success-border)] bg-[var(--color-success-soft)] px-4 py-3 text-sm text-[var(--color-success-text)]">
          <p className="font-semibold">Token created</p>
          {actionState.signature ? (
            <p className="mt-1 text-xs leading-5">
              Signature:{" "}
              <span className="break-all">{actionState.signature}</span>
            </p>
          ) : null}
          {actionState.mintAddress ? (
            <p className="mt-1 text-xs leading-5">
              Mint:{" "}
              <span className="break-all">{actionState.mintAddress}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {actionState.stage === "error" && actionState.message ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger-text)]">
          <p className="font-semibold">Something went wrong</p>
          <p className="mt-1 text-xs leading-5">{actionState.message}</p>
        </div>
      ) : null}
    </FormSection>
  );
}
