import { z } from "zod";
import {
  commonTokenSchema,
  decimalsField,
  initialSupplyField,
  solanaPublicKeyString,
} from "./common.schema";

/**
 * Authority configuration shared by transfer-fee and withdraw-withheld
 * authorities on Token-2022 transfer-fee tokens.
 *
 * - "self": the connecting wallet keeps the authority
 * - "address": a custom Solana address holds the authority
 * - "revoke": the authority is set to None (permanent)
 */
const authorityChoice = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("self") }),
  z.object({ kind: z.literal("address"), address: solanaPublicKeyString }),
  z.object({ kind: z.literal("revoke"), confirm: z.literal(true) }),
]);

const transferFeeBpsField = z
  .string()
  .trim()
  .refine((value) => value.length > 0, { message: "Transfer fee is required." })
  .refine((value) => /^\d+$/.test(value), {
    message: "Transfer fee must be a whole number of basis points.",
  })
  .refine(
    (value) => {
      const n = Number(value);
      return Number.isInteger(n) && n >= 0 && n <= 10_000;
    },
    {
      message: "Transfer fee must be between 0 and 10000 basis points (0%–100%).",
    },
  );

const maxTransferFeeField = z
  .string()
  .trim()
  .refine((value) => value.length > 0, {
    message: "Maximum per-transfer fee is required.",
  })
  .refine((value) => /^\d+$/.test(value), {
    message: "Maximum per-transfer fee must be a whole number.",
  })
  .refine((value) => value.length <= 24, {
    message: "Maximum per-transfer fee is too large.",
  });

export const taxTokenSchema = commonTokenSchema.extend({
  platform: z.literal("taxToken"),
  decimals: decimalsField,
  initialSupply: initialSupplyField,
  transferFeeBps: transferFeeBpsField,
  maxTransferFee: maxTransferFeeField,
  transferFeeAuthority: authorityChoice,
  withdrawWithheldAuthority: authorityChoice,
  revokeMintAuthority: z.boolean().default(false),
  revokeFreezeAuthority: z.boolean().default(false),
  makeImmutable: z.boolean().default(false),
});

export type TaxTokenValues = z.infer<typeof taxTokenSchema>;
