import { z } from "zod";
import { splTokenSchema, type SplTokenValues } from "./spl.schema";
import { taxTokenSchema, type TaxTokenValues } from "./tax-token.schema";
import { pumpFunSchema, type PumpFunValues } from "./pumpfun.schema";
import {
  raydiumLaunchlabSchema,
  type RaydiumLaunchlabValues,
} from "./raydium-launchlab.schema";
import {
  meteoraDbcSchema,
  type MeteoraDbcValues,
} from "./meteora-dbc.schema";
import type { CreateTokenPlatform } from "../../tool-config/create-token-platforms";

/**
 * Discriminated union over `platform`. The form island uses
 * `getCreateTokenSchema(platform)` instead so RHF only validates fields that
 * are actually rendered for the active platform.
 *
 * Note: there is no standalone `token2022` schema. The Tax Token schema is
 * the canonical Token-2022 entry — it covers Token-2022 with the transfer
 * fee extension, which is the only Token-2022 workflow we expose today.
 */
export const createTokenSchema = z.discriminatedUnion("platform", [
  splTokenSchema,
  taxTokenSchema,
  pumpFunSchema,
  raydiumLaunchlabSchema,
  meteoraDbcSchema,
]);

export type CreateTokenValues = z.infer<typeof createTokenSchema>;

export type CreateTokenValuesByPlatform<P extends CreateTokenPlatform> =
  P extends "spl"
    ? SplTokenValues
    : P extends "taxToken"
      ? TaxTokenValues
      : P extends "pumpfun"
        ? PumpFunValues
        : P extends "raydiumLaunchlab"
          ? RaydiumLaunchlabValues
          : P extends "meteoraDbc"
            ? MeteoraDbcValues
            : never;

const SCHEMAS = {
  spl: splTokenSchema,
  taxToken: taxTokenSchema,
  pumpfun: pumpFunSchema,
  raydiumLaunchlab: raydiumLaunchlabSchema,
  meteoraDbc: meteoraDbcSchema,
} as const;

export function getCreateTokenSchema(platform: CreateTokenPlatform) {
  return SCHEMAS[platform];
}

export {
  splTokenSchema,
  taxTokenSchema,
  pumpFunSchema,
  raydiumLaunchlabSchema,
  meteoraDbcSchema,
};

export type {
  SplTokenValues,
  TaxTokenValues,
  PumpFunValues,
  RaydiumLaunchlabValues,
  MeteoraDbcValues,
};
