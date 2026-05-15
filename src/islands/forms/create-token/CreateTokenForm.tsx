import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormShell } from "../components/FormShell";
import { FeeSummary } from "../components/FeeSummary";
import { ReviewPanel } from "../components/ReviewPanel";
import { ActionButton } from "../components/ActionButton";
import {
  CREATE_TOKEN_PLATFORMS,
  type CreateTokenPlatform,
} from "../../../lib/tool-config/create-token-platforms";
import {
  getCreateTokenSchema,
  type CreateTokenValues,
} from "../../../lib/validation/create-token/create-token.schema";
import { PlatformSection } from "./sections/PlatformSection";
import { TokenDetailsSection } from "./sections/TokenDetailsSection";
import { MetadataSection } from "./sections/MetadataSection";
import { PlatformOptionsSection } from "./sections/PlatformOptionsSection";
import { AuthoritiesSection } from "./sections/AuthoritiesSection";
import { ReviewCreateSection } from "./sections/ReviewCreateSection";
import { buildCreateTokenDefaultValues } from "./utils/build-default-values";
import { getPlatformFieldVisibility } from "./utils/get-platform-field-visibility";
import {
  buildReviewItems,
  type CreateTokenReviewSnapshot,
} from "./utils/build-review-items";
import { buildFeeLines } from "./utils/build-fee-lines";
import {
  getCreateTokenActionReadiness,
  type CreateTokenActionFlowState,
} from "./utils/get-action-readiness";

export interface CreateTokenFormProps {
  initialPlatform: CreateTokenPlatform;
}

interface WalletStatusDetail {
  isConnected?: boolean;
  address?: string;
  shortAddress?: string;
}

const SECTIONS = {
  platform: "platform",
  details: "details",
  metadata: "metadata",
  options: "options",
  authorities: "authorities",
  review: "review",
} as const;

/**
 * The single React island for the Create Token form.
 *
 * Responsibilities (orchestration only — no platform-specific JSX):
 * - initialize RHF with the platform-scoped Zod schema
 * - track local UI state: image File, wallet status, action flow state
 * - watch minimal form values for the live review panel
 * - compute the action button's readiness via `getCreateTokenActionReadiness`
 * - lazy-import `runCreateTokenAction` on submit (which lazy-loads wallet +
 *   `@solana/web3.js`)
 *
 * Constraints honoured:
 * - No top-level wallet/Reown/Solana SDK imports.
 * - SEO content stays in static Astro components, not in this island.
 */
export default function CreateTokenForm({
  initialPlatform,
}: CreateTokenFormProps) {
  const platform = CREATE_TOKEN_PLATFORMS[initialPlatform];
  const visibility = useMemo(
    () => getPlatformFieldVisibility(initialPlatform),
    [initialPlatform],
  );

  const schema = useMemo(
    () => getCreateTokenSchema(initialPlatform),
    [initialPlatform],
  );
  const defaultValues = useMemo(
    () => buildCreateTokenDefaultValues(initialPlatform),
    [initialPlatform],
  );

  const form = useForm<CreateTokenValues>({
    resolver: zodResolver(schema) as unknown as Resolver<CreateTokenValues>,
    defaultValues,
    mode: "onChange",
    shouldUnregister: false,
  });

  const {
    control,
    handleSubmit,
    formState: { isValid, isDirty },
  } = form;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [walletStatus, setWalletStatus] = useState<WalletStatusDetail>(() =>
    readCachedWalletStatus(),
  );
  const [actionState, setActionState] = useState<CreateTokenActionFlowState>({
    stage: "idle",
  });
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<WalletStatusDetail>).detail ?? {};
      setWalletStatus(detail);
    };
    window.addEventListener("solana-wallet-status-change", handler);
    return () =>
      window.removeEventListener("solana-wallet-status-change", handler);
  }, []);

  // Watch the entire form for the live review panel. We treat the value as
  // a wide structural snapshot so we don't have to fight the discriminated
  // union narrowing in `buildReviewItems`.
  const watched = useWatch({
    control,
  }) as CreateTokenReviewSnapshot;

  const reviewItems = buildReviewItems(watched, platform, visibility);
  const feeLines = useMemo(() => buildFeeLines(platform), [platform]);

  const readiness = getCreateTokenActionReadiness({
    isValid,
    hasInteracted: isDirty,
    walletConnected: Boolean(walletStatus.isConnected && walletStatus.address),
    actionState,
  });

  const onValidSubmit = async (formValues: CreateTokenValues) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setActionState({ stage: "preparing" });

    try {
      const action = await import("../../../lib/tool-actions/create-token");

      const result = await action.runCreateTokenAction({
        values: formValues,
        imageFile,
        onProgress: (event) => {
          if (event.stage === "preparing-transaction") {
            setActionState({ stage: "preparing" });
          } else if (event.stage === "awaiting-signature") {
            setActionState({ stage: "signing" });
          } else if (event.stage === "submitting") {
            setActionState({ stage: "submitting" });
          } else if (event.stage === "confirming") {
            setActionState({ stage: "confirming" });
          }
        },
      });

      setActionState({
        stage: "success",
        signature: result.signature,
        mintAddress: result.mintAddress,
      });
    } catch (err) {
      const action = await import("../../../lib/tool-actions/create-token");
      const normalized = action.normalizeCreateTokenError(err);
      setActionState({ stage: "error", message: normalized.message });
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <FormShell
      title="Create token"
      description="Fill the form below. The form is fully fillable before you connect a wallet — wallet is required only for the final signing step."
      onSubmit={handleSubmit(onValidSubmit)}
      rightPanel={
        <>
          <ReviewPanel items={reviewItems} />
          <FeeSummary
            lines={feeLines}
            totalLabel="Estimated total"
            totalValue="Shown after review"
            footer="Final fee numbers come from dxra-core-api right before you sign."
          />
          <ActionButton
            state={readiness.state}
            helper={readiness.helper}
            tone="primary"
            disabled={!readiness.canSubmit}
          >
            {readiness.label}
          </ActionButton>
        </>
      }
    >
      <PlatformSection id={SECTIONS.platform} platform={platform} />

      <TokenDetailsSection
        id={SECTIONS.details}
        platform={platform}
        visibility={visibility}
        form={form}
      />

      <MetadataSection
        id={SECTIONS.metadata}
        visibility={visibility}
        form={form}
        imageFile={imageFile}
        onImageChange={setImageFile}
      />

      <PlatformOptionsSection
        id={SECTIONS.options}
        platform={platform}
        visibility={visibility}
        form={form}
      />

      <AuthoritiesSection
        id={SECTIONS.authorities}
        platform={platform}
        visibility={visibility}
        form={form}
      />

      <ReviewCreateSection id={SECTIONS.review} actionState={actionState} />
    </FormShell>
  );
}

function readCachedWalletStatus(): WalletStatusDetail {
  if (typeof window === "undefined") return {};
  try {
    const cached = window.localStorage.getItem("solana-wallet-address");
    if (cached) {
      return { isConnected: true, address: cached };
    }
  } catch {
    // localStorage may be unavailable (privacy mode) — treat as disconnected.
  }
  return {};
}
