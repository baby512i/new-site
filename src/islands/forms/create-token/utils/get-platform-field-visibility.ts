import {
  CREATE_TOKEN_PLATFORMS,
  type CreateTokenPlatform,
} from "../../../../lib/tool-config/create-token-platforms";

/**
 * Centralised "what does the form render for this platform" decision.
 *
 * The source of truth is `CREATE_TOKEN_PLATFORMS[platform].supports` — this
 * helper just translates those capability flags into the visibility names the
 * form sections actually consume, so individual JSX never has to repeat the
 * same `platform.supports.x` ternaries.
 */
export type PlatformFieldVisibility = {
  showDecimals: boolean;
  showInitialSupply: boolean;
  showAuthorities: boolean;
  showTaxFields: boolean;
  showLaunchBuy: boolean;
  showBondingCurve: boolean;
  showMetadata: boolean;
  showSocialLinks: boolean;
  showImageUpload: boolean;
};

export function getPlatformFieldVisibility(
  platform: CreateTokenPlatform,
): PlatformFieldVisibility {
  const supports = CREATE_TOKEN_PLATFORMS[platform].supports;

  return {
    showDecimals: supports.decimals,
    showInitialSupply: supports.initialSupply,
    showAuthorities:
      supports.revokeMintAuthority ||
      supports.revokeFreezeAuthority ||
      supports.makeImmutable,
    showTaxFields: supports.transferFee,
    showLaunchBuy: supports.initialBuy,
    showBondingCurve: supports.bondingCurvePreset,
    showMetadata: supports.metadata,
    showSocialLinks: supports.socialLinks,
    showImageUpload: supports.imageUpload,
  };
}
