import type { CreateTokenPlatform } from "../../../../lib/tool-config/create-token-platforms";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";
import { mergeDraftIntoDefaults } from "./create-token-draft-storage";

const sharedDefaults = {
  tokenName: "",
  symbol: "",
  description: undefined,
  includeSocialLinks: false,
  website: undefined,
  telegram: undefined,
  twitter: undefined,
  includeAdvancedOptions: false,
  includeCreatorInfo: false,
  creatorName: undefined,
  creatorWebsite: undefined,
  includeVanityAddress: false,
  vanityPrefix: undefined,
  vanitySuffix: undefined,
  vanityCaseSensitive: false,
} as const;

function buildPlatformDefaults(platform: CreateTokenPlatform): CreateTokenValues {
  switch (platform) {
    case "spl":
      return {
        platform: "spl",
        ...sharedDefaults,
        decimals: "",
        initialSupply: "",
        revokeMintAuthority: false,
        revokeFreezeAuthority: false,
        makeImmutable: false,
      };

    case "taxToken":
      return {
        platform: "taxToken",
        ...sharedDefaults,
        decimals: "",
        initialSupply: "",
        transferFeeBps: "100",
        maxTransferFee: "1000000000",
        transferFeeAuthority: { kind: "self" },
        withdrawWithheldAuthority: { kind: "self" },
        revokeMintAuthority: false,
        revokeFreezeAuthority: false,
        makeImmutable: false,
      };

    case "pumpfun":
      return {
        platform: "pumpfun",
        ...sharedDefaults,
        initialBuy: undefined,
      };

    case "raydiumLaunchlab":
      return {
        platform: "raydiumLaunchlab",
        ...sharedDefaults,
        launchSettings: undefined,
        initialBuy: undefined,
      };

    case "meteoraDbc":
      return {
        platform: "meteoraDbc",
        ...sharedDefaults,
        curvePreset: "balanced",
      };
  }
}

/** SSR-safe defaults — no sessionStorage reads. */
export function buildCreateTokenStaticDefaults(
  platform: CreateTokenPlatform,
): CreateTokenValues {
  return buildPlatformDefaults(platform);
}

/**
 * Defaults merged with any session draft. Use only after mount to avoid
 * hydration mismatches between server HTML and client sessionStorage.
 */
export function buildCreateTokenDefaultValues(
  platform: CreateTokenPlatform,
): CreateTokenValues {
  return mergeDraftIntoDefaults(platform, buildPlatformDefaults(platform));
}
