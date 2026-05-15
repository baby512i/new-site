import type { CreateTokenPlatform } from "../../../../lib/tool-config/create-token-platforms";

export const CREATE_TOKEN_DRAFT_KEY = "create-token-form-draft-v1";

export interface CreateTokenSharedDraft {
  tokenName?: string;
  symbol?: string;
  description?: string;
  includeSocialLinks?: boolean;
  website?: string;
  telegram?: string;
  twitter?: string;
  includeAdvancedOptions?: boolean;
  includeCreatorInfo?: boolean;
  creatorName?: string;
  creatorWebsite?: string;
  includeVanityAddress?: boolean;
  vanityPrefix?: string;
  vanitySuffix?: string;
  vanityCaseSensitive?: boolean;
}

export type CreateTokenPlatformDraft = Record<string, unknown>;

export interface CreateTokenDraftV1 {
  shared: CreateTokenSharedDraft;
  platforms: Partial<Record<CreateTokenPlatform, CreateTokenPlatformDraft>>;
}

const SHARED_KEYS: (keyof CreateTokenSharedDraft)[] = [
  "tokenName",
  "symbol",
  "description",
  "includeSocialLinks",
  "website",
  "telegram",
  "twitter",
  "includeAdvancedOptions",
  "includeCreatorInfo",
  "creatorName",
  "creatorWebsite",
  "includeVanityAddress",
  "vanityPrefix",
  "vanitySuffix",
  "vanityCaseSensitive",
];

const PLATFORM_ONLY_KEYS = new Set([
  "platform",
  "decimals",
  "initialSupply",
  "transferFeeBps",
  "maxTransferFee",
  "transferFeeAuthority",
  "withdrawWithheldAuthority",
  "revokeMintAuthority",
  "revokeFreezeAuthority",
  "makeImmutable",
  "initialBuy",
  "launchSettings",
  "curvePreset",
]);

function stripLegacyDraftFields(
  shared: CreateTokenSharedDraft,
): CreateTokenSharedDraft {
  const next = { ...shared };
  delete (next as Record<string, unknown>).tokenImage;
  return next;
}

export function readCreateTokenDraft(): CreateTokenDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CREATE_TOKEN_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CreateTokenDraftV1;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      shared: stripLegacyDraftFields(parsed.shared ?? {}),
      platforms: parsed.platforms ?? {},
    };
  } catch {
    return null;
  }
}

export function writeCreateTokenDraft(draft: CreateTokenDraftV1): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readCreateTokenDraft();
    const toWrite: CreateTokenDraftV1 = {
      shared: stripLegacyDraftFields({
        ...existing?.shared,
        ...draft.shared,
      }),
      platforms: { ...existing?.platforms, ...draft.platforms },
    };
    window.sessionStorage.setItem(
      CREATE_TOKEN_DRAFT_KEY,
      JSON.stringify(toWrite),
    );
  } catch {
    // sessionStorage may be unavailable or quota exceeded.
  }
}

export function clearCreateTokenDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CREATE_TOKEN_DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function splitFormValuesForDraft(
  platform: CreateTokenPlatform,
  values: Record<string, unknown>,
): CreateTokenDraftV1 {
  const shared: CreateTokenSharedDraft = {};
  const platformValues: CreateTokenPlatformDraft = {};

  for (const [key, value] of Object.entries(values)) {
    if (SHARED_KEYS.includes(key as keyof CreateTokenSharedDraft)) {
      (shared as Record<string, unknown>)[key] = value;
    } else if (PLATFORM_ONLY_KEYS.has(key)) {
      platformValues[key] = value;
    }
  }

  const existing = readCreateTokenDraft();
  return {
    shared: stripLegacyDraftFields({ ...existing?.shared, ...shared }),
    platforms: {
      ...existing?.platforms,
      [platform]: { ...existing?.platforms?.[platform], ...platformValues },
    },
  };
}

export function mergeDraftIntoDefaults<T extends Record<string, unknown>>(
  platform: CreateTokenPlatform,
  defaults: T,
): T {
  const draft = readCreateTokenDraft();
  if (!draft) return defaults;

  const merged = { ...defaults };

  for (const key of SHARED_KEYS) {
    const value = draft.shared[key];
    if (value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  const platformDraft = draft.platforms[platform];
  if (platformDraft) {
    for (const [key, value] of Object.entries(platformDraft)) {
      if (value !== undefined) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
  }

  const mergedRecord = merged as Record<string, unknown>;

  if (!mergedRecord.includeSocialLinks) {
    mergedRecord.website = undefined;
    mergedRecord.telegram = undefined;
    mergedRecord.twitter = undefined;
  }

  if (!mergedRecord.includeAdvancedOptions) {
    mergedRecord.includeCreatorInfo = false;
    mergedRecord.includeVanityAddress = false;
    mergedRecord.creatorName = undefined;
    mergedRecord.creatorWebsite = undefined;
    mergedRecord.vanityPrefix = undefined;
    mergedRecord.vanitySuffix = undefined;
    mergedRecord.vanityCaseSensitive = false;
  } else {
    if (!mergedRecord.includeCreatorInfo) {
      mergedRecord.creatorName = undefined;
      mergedRecord.creatorWebsite = undefined;
    }
    if (!mergedRecord.includeVanityAddress) {
      mergedRecord.vanityPrefix = undefined;
      mergedRecord.vanitySuffix = undefined;
      mergedRecord.vanityCaseSensitive = false;
    }
  }

  if (
    mergedRecord.includeCreatorInfo ||
    mergedRecord.includeVanityAddress
  ) {
    mergedRecord.includeAdvancedOptions = true;
  }

  return merged;
}
