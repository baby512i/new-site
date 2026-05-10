import type { CreateTokenPlatform } from "../../../../lib/tool-config/create-token-platforms";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";

/**
 * Default form values for each platform.
 *
 * Rules:
 * - Only include fields the platform actually shows. Hidden platform-specific
 *   fields are intentionally absent from the per-platform default object so
 *   they cannot accidentally appear in the payload.
 * - Amount-like fields stay as strings (no JS number precision loss).
 * - The image File is held in local React state, NOT inside form values.
 */
export function buildCreateTokenDefaultValues(
  platform: CreateTokenPlatform,
): CreateTokenValues {
  switch (platform) {
    case "spl":
      return {
        platform: "spl",
        tokenName: "",
        symbol: "",
        description: undefined,
        website: undefined,
        telegram: undefined,
        twitter: undefined,
        decimals: "9",
        initialSupply: "1000000000",
        revokeMintAuthority: false,
        revokeFreezeAuthority: false,
        makeImmutable: false,
      };

    case "taxToken":
      return {
        platform: "taxToken",
        tokenName: "",
        symbol: "",
        description: undefined,
        website: undefined,
        telegram: undefined,
        twitter: undefined,
        decimals: "9",
        initialSupply: "1000000000",
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
        tokenName: "",
        symbol: "",
        description: undefined,
        website: undefined,
        telegram: undefined,
        twitter: undefined,
        initialBuy: undefined,
      };

    case "raydiumLaunchlab":
      return {
        platform: "raydiumLaunchlab",
        tokenName: "",
        symbol: "",
        description: undefined,
        website: undefined,
        telegram: undefined,
        twitter: undefined,
        launchSettings: undefined,
        initialBuy: undefined,
      };

    case "meteoraDbc":
      return {
        platform: "meteoraDbc",
        tokenName: "",
        symbol: "",
        description: undefined,
        website: undefined,
        telegram: undefined,
        twitter: undefined,
        curvePreset: "balanced",
      };
  }
}
