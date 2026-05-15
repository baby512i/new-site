import type {
  CreateTokenValues,
  MeteoraDbcValues,
  PumpFunValues,
  RaydiumLaunchlabValues,
  SplTokenValues,
  TaxTokenValues,
} from "./create-token.schema";
import type { CreateTokenPlatform } from "../../tool-config/create-token-platforms";

/**
 * Wire payload sent to dxra-core-api. Each platform has its own shape.
 *
 * The `image` field is intentionally NOT included here. The dxra-api wrapper
 * (`src/lib/dxra-api/create-token.ts`) attaches the image descriptor itself
 * from the raw `File` it receives, so this function stays purely about
 * structured form data.
 */
export type CreateTokenImageDescriptor =
  | {
      kind: "file";
      name: string;
      type: string;
      size: number;
    }
  | { kind: "none" };

interface CommonPayloadFields {
  tokenName: string;
  symbol: string;
  description?: string;
  website?: string;
  telegram?: string;
  twitter?: string;
}

export interface SplCreateTokenPayload extends CommonPayloadFields {
  platform: "spl";
  decimals: number;
  initialSupply: string;
  authorities: {
    revokeMint: boolean;
    revokeFreeze: boolean;
    makeImmutable: boolean;
  };
}

export interface TaxTokenCreateTokenPayload extends CommonPayloadFields {
  platform: "taxToken";
  decimals: number;
  initialSupply: string;
  transferFeeBps: number;
  /** Stays a string to keep large numbers safe across the wire. */
  maxTransferFee: string;
  transferFeeAuthority:
    | { kind: "self" }
    | { kind: "address"; address: string }
    | { kind: "revoke" };
  withdrawWithheldAuthority:
    | { kind: "self" }
    | { kind: "address"; address: string }
    | { kind: "revoke" };
  authorities: {
    revokeMint: boolean;
    revokeFreeze: boolean;
    makeImmutable: boolean;
  };
}

export interface PumpFunCreateTokenPayload extends CommonPayloadFields {
  platform: "pumpfun";
  /** Optional initial buy in SOL as a string for precision. */
  initialBuySol?: string;
}

export interface RaydiumLaunchlabCreateTokenPayload extends CommonPayloadFields {
  platform: "raydiumLaunchlab";
  initialBuySol?: string;
  launchSettings?: {
    quote?: "SOL";
  };
}

export interface MeteoraDbcCreateTokenPayload extends CommonPayloadFields {
  platform: "meteoraDbc";
  curvePreset: string;
}

export type CreateTokenPayload =
  | SplCreateTokenPayload
  | TaxTokenCreateTokenPayload
  | PumpFunCreateTokenPayload
  | RaydiumLaunchlabCreateTokenPayload
  | MeteoraDbcCreateTokenPayload;

export type CreateTokenPayloadByPlatform<P extends CreateTokenPlatform> =
  P extends "spl"
    ? SplCreateTokenPayload
    : P extends "taxToken"
      ? TaxTokenCreateTokenPayload
      : P extends "pumpfun"
        ? PumpFunCreateTokenPayload
        : P extends "raydiumLaunchlab"
          ? RaydiumLaunchlabCreateTokenPayload
          : P extends "meteoraDbc"
            ? MeteoraDbcCreateTokenPayload
            : never;

function commonFields(values: CreateTokenValues): CommonPayloadFields {
  return {
    tokenName: values.tokenName.trim(),
    symbol: values.symbol.trim(),
    description: trimToUndefined(values.description),
    website: trimToUndefined(values.website),
    telegram: trimToUndefined(values.telegram),
    twitter: trimToUndefined(values.twitter),
  };
}

function trimToUndefined(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Convert validated form state into the wire payload for dxra-core-api.
 * Hidden / irrelevant fields are dropped here, NOT inside the schema.
 */
export function toPayload(values: CreateTokenValues): CreateTokenPayload {
  switch (values.platform) {
    case "spl":
      return splPayload(values);
    case "taxToken":
      return taxTokenPayload(values);
    case "pumpfun":
      return pumpfunPayload(values);
    case "raydiumLaunchlab":
      return raydiumLaunchlabPayload(values);
    case "meteoraDbc":
      return meteoraDbcPayload(values);
  }
}

function splPayload(values: SplTokenValues): SplCreateTokenPayload {
  return {
    platform: "spl",
    ...commonFields(values),
    decimals: Number(values.decimals),
    initialSupply: values.initialSupply.trim(),
    authorities: {
      revokeMint: values.revokeMintAuthority,
      revokeFreeze: values.revokeFreezeAuthority,
      makeImmutable: values.makeImmutable,
    },
  };
}

function taxTokenPayload(values: TaxTokenValues): TaxTokenCreateTokenPayload {
  return {
    platform: "taxToken",
    ...commonFields(values),
    decimals: Number(values.decimals),
    initialSupply: values.initialSupply.trim(),
    transferFeeBps: Number(values.transferFeeBps),
    maxTransferFee: values.maxTransferFee.trim(),
    transferFeeAuthority: stripAuthority(values.transferFeeAuthority),
    withdrawWithheldAuthority: stripAuthority(values.withdrawWithheldAuthority),
    authorities: {
      revokeMint: values.revokeMintAuthority,
      revokeFreeze: values.revokeFreezeAuthority,
      makeImmutable: values.makeImmutable,
    },
  };
}

function stripAuthority(authority: TaxTokenValues["transferFeeAuthority"]) {
  if (authority.kind === "address") {
    return { kind: "address" as const, address: authority.address.trim() };
  }
  if (authority.kind === "revoke") {
    return { kind: "revoke" as const };
  }
  return { kind: "self" as const };
}

function pumpfunPayload(values: PumpFunValues): PumpFunCreateTokenPayload {
  return {
    platform: "pumpfun",
    ...commonFields(values),
    initialBuySol: values.initialBuy,
  };
}

function raydiumLaunchlabPayload(
  values: RaydiumLaunchlabValues,
): RaydiumLaunchlabCreateTokenPayload {
  return {
    platform: "raydiumLaunchlab",
    ...commonFields(values),
    initialBuySol: values.initialBuy,
    launchSettings: values.launchSettings,
  };
}

function meteoraDbcPayload(
  values: MeteoraDbcValues,
): MeteoraDbcCreateTokenPayload {
  return {
    platform: "meteoraDbc",
    ...commonFields(values),
    curvePreset: values.curvePreset,
  };
}
