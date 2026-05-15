import type { FieldErrors } from "react-hook-form";
import type { CreateTokenPlatform } from "../../../../lib/tool-config/create-token-platforms";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";
import type { PlatformFieldVisibility } from "./get-platform-field-visibility";
import {
  getFieldErrorMessage,
  getNestedFieldErrorMessage,
} from "./form-errors";

type ErrorBag = FieldErrors<CreateTokenValues>;

/** Field ids follow `htmlFor` / input `id` on visible controls. */
const FIELD_SCROLL_ORDER: string[] = [
  "tokenName",
  "symbol",
  "decimals",
  "initialSupply",
  "transferFeeBps",
  "maxTransferFee",
  "transferFeeAuthority",
  "withdrawWithheldAuthority",
  "curvePreset",
  "initialBuy",
  "description",
  "website",
  "telegram",
  "twitter",
  "creatorName",
  "creatorWebsite",
  "vanityPrefix",
  "vanitySuffix",
  "revokeMintAuthority",
  "revokeFreezeAuthority",
  "makeImmutable",
];

function isFieldVisible(
  fieldId: string,
  visibility: PlatformFieldVisibility,
  values: Partial<CreateTokenValues>,
): boolean {
  switch (fieldId) {
    case "decimals":
      return visibility.showDecimals;
    case "initialSupply":
      return visibility.showInitialSupply;
    case "transferFeeBps":
    case "maxTransferFee":
    case "transferFeeAuthority":
    case "withdrawWithheldAuthority":
      return visibility.showTaxFields;
    case "curvePreset":
      return visibility.showBondingCurve;
    case "initialBuy":
      return visibility.showLaunchBuy;
    case "website":
    case "telegram":
    case "twitter":
      return (
        visibility.showSocialLinks &&
        Boolean(values.includeSocialLinks)
      );
    case "creatorName":
    case "creatorWebsite":
      return (
        Boolean(values.includeAdvancedOptions) &&
        Boolean(values.includeCreatorInfo)
      );
    case "vanityPrefix":
    case "vanitySuffix":
      return (
        Boolean(values.includeAdvancedOptions) &&
        Boolean(values.includeVanityAddress)
      );
    case "revokeMintAuthority":
    case "revokeFreezeAuthority":
    case "makeImmutable":
      return visibility.showAuthorities;
    default:
      return true;
  }
}

function fieldHasError(errors: ErrorBag, fieldId: string): boolean {
  if (getFieldErrorMessage(errors, fieldId)) return true;
  if (getNestedFieldErrorMessage(errors, fieldId)) return true;
  return false;
}

function focusFieldElement(fieldId: string): boolean {
  const byId = document.getElementById(fieldId);
  if (byId instanceof HTMLElement) {
    byId.scrollIntoView({ behavior: "smooth", block: "center" });
    if (
      byId instanceof HTMLInputElement ||
      byId instanceof HTMLTextAreaElement ||
      byId instanceof HTMLSelectElement
    ) {
      byId.focus({ preventScroll: true });
    } else {
      const focusable = byId.querySelector<HTMLElement>(
        "input, textarea, select, button[role='switch']",
      );
      focusable?.focus({ preventScroll: true });
    }
    return true;
  }

  const byName = document.querySelector<HTMLElement>(`[name="${fieldId}"]`);
  if (byName) {
    byName.scrollIntoView({ behavior: "smooth", block: "center" });
    byName.focus({ preventScroll: true });
    return true;
  }

  return false;
}

/**
 * Scroll to and focus the first invalid field that is currently visible.
 */
export function scrollToFirstFormError(
  errors: ErrorBag,
  visibility: PlatformFieldVisibility,
  values: Partial<CreateTokenValues>,
): boolean {
  for (const fieldId of FIELD_SCROLL_ORDER) {
    if (!isFieldVisible(fieldId, visibility, values)) continue;
    if (!fieldHasError(errors, fieldId)) continue;
    return focusFieldElement(fieldId);
  }
  return false;
}
