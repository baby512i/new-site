import type { CreateTokenPlatformConfig } from "../../../../lib/tool-config/create-token-platforms";
import type { ReviewItem } from "../../components/ReviewPanel";
import type { PlatformFieldVisibility } from "./get-platform-field-visibility";

/**
 * Wide structural snapshot. The form watches the live `useWatch` value which
 * is `DeepPartial<CreateTokenValues>` — that union narrows poorly across
 * branches, so we read fields defensively with optional access here.
 */
export interface CreateTokenReviewSnapshot {
  tokenName?: string;
  symbol?: string;
  decimals?: string;
  initialSupply?: string;
  transferFeeBps?: string;
  maxTransferFee?: string;
  curvePreset?: string;
  initialBuy?: string;
  revokeMintAuthority?: boolean;
  revokeFreezeAuthority?: boolean;
  makeImmutable?: boolean;
}

const DASH = "—";

/**
 * Build the review-panel rows for the active platform, omitting fields the
 * platform does not support so users never see empty/N/A rows.
 */
export function buildReviewItems(
  values: CreateTokenReviewSnapshot,
  platform: CreateTokenPlatformConfig,
  visibility: PlatformFieldVisibility,
): ReviewItem[] {
  const items: ReviewItem[] = [
    { label: "Platform", value: platform.label },
    { label: "Name", value: nonEmpty(values.tokenName) ?? DASH },
    { label: "Symbol", value: nonEmpty(values.symbol) ?? DASH },
  ];

  if (visibility.showDecimals && nonEmpty(values.decimals)) {
    items.push({ label: "Decimals", value: values.decimals as string });
  }

  if (visibility.showInitialSupply && nonEmpty(values.initialSupply)) {
    items.push({ label: "Initial supply", value: values.initialSupply as string });
  }

  if (visibility.showTaxFields && nonEmpty(values.transferFeeBps)) {
    const bps = Number(values.transferFeeBps);
    items.push({
      label: "Transfer fee",
      value: Number.isFinite(bps)
        ? `${bps} bps (${(bps / 100).toFixed(2)}%)`
        : DASH,
      warn: Number.isFinite(bps) && bps > 500,
    });
  }

  if (visibility.showTaxFields && nonEmpty(values.maxTransferFee)) {
    items.push({
      label: "Max fee per transfer",
      value: values.maxTransferFee as string,
    });
  }

  if (visibility.showBondingCurve && nonEmpty(values.curvePreset)) {
    items.push({ label: "Curve preset", value: values.curvePreset as string });
  }

  if (visibility.showLaunchBuy && nonEmpty(values.initialBuy)) {
    items.push({ label: "Initial buy", value: `${values.initialBuy} SOL` });
  }

  if (visibility.showAuthorities) {
    if (values.revokeMintAuthority) {
      items.push({ label: "Revoke mint", value: "Yes (permanent)", warn: true });
    }
    if (values.revokeFreezeAuthority) {
      items.push({ label: "Revoke freeze", value: "Yes (permanent)", warn: true });
    }
    if (values.makeImmutable) {
      items.push({
        label: "Metadata immutable",
        value: "Yes (permanent)",
        warn: true,
      });
    }
  }

  return items;
}

function nonEmpty(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
