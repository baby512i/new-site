import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type FieldErrors, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormShell } from "../components/FormShell";
import { FeeSummary } from "../components/FeeSummary";
import { ReviewPanel } from "../components/ReviewPanel";
import { ActionButton } from "../components/ActionButton";
import { ToastProvider } from "../../ui/toast/ToastProvider";
import { useToast } from "../../ui/toast/useToast";
import {
  CREATE_TOKEN_PLATFORMS,
  type CreateTokenPlatform,
} from "../../../lib/tool-config/create-token-platforms";
import {
  getStoredSolanaNetwork,
  normalizeSolanaNetwork,
  type SolanaNetworkValue,
} from "../../../lib/network/solana-network";
import {
  getCreateTokenSchema,
  type CreateTokenValues,
} from "../../../lib/validation/create-token/create-token.schema";
import { TokenDetailsSection } from "./sections/TokenDetailsSection";
import { MetadataSection } from "./sections/MetadataSection";
import { AdvancedOptionsSection } from "./sections/AdvancedOptionsSection";
import { PlatformOptionsSection } from "./sections/PlatformOptionsSection";
import { AuthoritiesSection } from "./sections/AuthoritiesSection";
import {
  buildCreateTokenDefaultValues,
  buildCreateTokenStaticDefaults,
} from "./utils/build-default-values";
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
import {
  getActionErrorMessage,
  resolveCreateTokenActionErrorCode,
} from "./utils/action-error-messages";
import { scrollToFirstFormError } from "./utils/scroll-to-first-error";
import { scrollToTokenImage } from "./utils/scroll-to-token-image";
import {
  splitFormValuesForDraft,
  writeCreateTokenDraft,
} from "./utils/create-token-draft-storage";

export interface CreateTokenFormProps {
  initialPlatform: CreateTokenPlatform;
}

interface WalletStatusDetail {
  isConnected?: boolean;
  address?: string;
  shortAddress?: string;
}

const SECTIONS = {
  details: "details",
  metadata: "metadata",
  advanced: "advanced",
  options: "options",
  authorities: "authorities",
} as const;

function networkLabel(network: SolanaNetworkValue): string {
  return network === "devnet" ? "Devnet" : "Mainnet";
}

export default function CreateTokenForm({
  initialPlatform,
}: CreateTokenFormProps) {
  return (
    <ToastProvider>
      <CreateTokenFormInner initialPlatform={initialPlatform} />
    </ToastProvider>
  );
}

function CreateTokenFormInner({ initialPlatform }: CreateTokenFormProps) {
  const toast = useToast();
  const platform = CREATE_TOKEN_PLATFORMS[initialPlatform];
  const visibility = useMemo(
    () => getPlatformFieldVisibility(initialPlatform),
    [initialPlatform],
  );

  const schema = useMemo(
    () => getCreateTokenSchema(initialPlatform),
    [initialPlatform],
  );
  const staticDefaults = useMemo(
    () => buildCreateTokenStaticDefaults(initialPlatform),
    [initialPlatform],
  );

  const form = useForm<CreateTokenValues>({
    resolver: zodResolver(schema) as unknown as Resolver<CreateTokenValues>,
    defaultValues: staticDefaults,
    mode: "onChange",
    shouldUnregister: false,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid, isDirty },
  } = form;

  const draftHydratedRef = useRef(false);
  useEffect(() => {
    if (draftHydratedRef.current) return;
    draftHydratedRef.current = true;
    reset(buildCreateTokenDefaultValues(initialPlatform));
  }, [initialPlatform, reset]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | undefined>();
  const imageRequired = visibility.showImageUpload;
  const hasRequiredImage = !imageRequired || Boolean(imageFile);
  const formComplete = isValid && hasRequiredImage;
  const [walletStatus, setWalletStatus] = useState<WalletStatusDetail>({});
  const [network, setNetwork] = useState<SolanaNetworkValue>(() =>
    normalizeSolanaNetwork(import.meta.env.PUBLIC_DEFAULT_NETWORK),
  );
  const [actionState, setActionState] = useState<CreateTokenActionFlowState>({
    stage: "idle",
  });
  const isSubmittingRef = useRef(false);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    setWalletStatus(readCachedWalletStatus());
    setNetwork(getStoredSolanaNetwork());

    const walletHandler = (event: Event) => {
      const detail = (event as CustomEvent<WalletStatusDetail>).detail ?? {};
      setWalletStatus(detail);
    };
    const networkHandler = () => setNetwork(getStoredSolanaNetwork());
    window.addEventListener("solana-wallet-status-change", walletHandler);
    window.addEventListener("solana-network-change", networkHandler);
    return () => {
      window.removeEventListener("solana-wallet-status-change", walletHandler);
      window.removeEventListener("solana-network-change", networkHandler);
    };
  }, []);

  const watched = useWatch({
    control,
  }) as CreateTokenReviewSnapshot;

  useEffect(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const values = form.getValues() as Record<string, unknown>;
      writeCreateTokenDraft(
        splitFormValuesForDraft(initialPlatform, values),
      );
    }, 400);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [watched, initialPlatform, form]);

  const reviewItems = buildReviewItems(
    watched,
    platform,
    visibility,
    networkLabel(network),
  );

  const feeResult = useMemo(
    () => buildFeeLines(initialPlatform, watched),
    [initialPlatform, watched],
  );

  const readiness = getCreateTokenActionReadiness({
    isValid: formComplete,
    hasInteracted: isDirty || Boolean(imageError),
    walletConnected: Boolean(walletStatus.isConnected && walletStatus.address),
    actionState,
  });

  const handleImageChange = useCallback((file: File | null) => {
    setImageFile(file);
    if (file) setImageError(undefined);
  }, []);

  const validateRequiredImage = useCallback((): boolean => {
    if (!imageRequired || imageFile) {
      setImageError(undefined);
      return true;
    }
    setImageError("Token image is required.");
    return false;
  }, [imageFile, imageRequired]);

  const onInvalidSubmit = useCallback(
    (fieldErrors: FieldErrors<CreateTokenValues>) => {
      const imageValid = validateRequiredImage();
      if (!imageValid) {
        scrollToTokenImage();
      } else {
        scrollToFirstFormError(fieldErrors, visibility, form.getValues());
      }
      toast.warning("Please fix the highlighted fields.");
    },
    [form, toast, validateRequiredImage, visibility],
  );

  const onValidSubmit = async (formValues: CreateTokenValues) => {
    if (!validateRequiredImage()) {
      scrollToTokenImage();
      toast.warning("Please fix the highlighted fields.");
      return;
    }
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
      toast.success("Token created", "Your transaction was submitted successfully.");
    } catch (err) {
      const code = resolveCreateTokenActionErrorCode(err);
      toast.error(getActionErrorMessage(code));
      setActionState({ stage: "error" });
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const walletHelper =
    walletStatus.isConnected && walletStatus.address
      ? `Connected: ${truncateMiddle(walletStatus.address)}`
      : "Wallet not connected";

  return (
    <FormShell
      onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
      rightPanel={
        <>
          <ReviewPanel
            items={reviewItems}
            tokenImagePreviewUrl={
              imageRequired ? imagePreviewUrl : null
            }
            footer={
              <p className="text-xs leading-5 text-[var(--color-text-muted)]">
                {walletHelper}
              </p>
            }
          />
          <FeeSummary
            lines={feeResult.lines}
            totalLabel="Estimated total"
            totalValue={feeResult.totalSol}
            footer="Approximate fees from platform config. Final amounts are confirmed before you sign."
          />

          <ActionButton
            state={readiness.state}
            helper={
              readiness.state === "wallet-required" ? readiness.helper : undefined
            }
            tone="primary"
            disabled={!readiness.canSubmit}
          >
            {readiness.label}
          </ActionButton>
        </>
      }
    >
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
        onImageChange={handleImageChange}
        imageError={imageError}
        onImageBlur={validateRequiredImage}
      />

      <AdvancedOptionsSection id={SECTIONS.advanced} form={form} />

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
    // localStorage may be unavailable.
  }
  return {};
}

function truncateMiddle(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
