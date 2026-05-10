import { z } from "zod";
import { commonTokenSchema } from "./common.schema";

/**
 * Pump.fun does not expose decimals or initial supply — the platform fixes both.
 * Optional initialBuy is in SOL (string to keep precision).
 */
const initialBuyField = z
  .string()
  .trim()
  .max(24, "Initial buy is too large.")
  .optional()
  .transform((value) => (value === undefined || value === "" ? undefined : value))
  .refine(
    (value) => {
      if (value === undefined) return true;
      if (!/^\d+(\.\d{1,9})?$/.test(value)) return false;
      const n = Number(value);
      return Number.isFinite(n) && n > 0 && n <= 1000;
    },
    {
      message: "Initial buy must be a positive SOL amount up to 1000 (max 9 decimals).",
    },
  );

export const pumpFunSchema = commonTokenSchema.extend({
  platform: z.literal("pumpfun"),
  /** Pump.fun uses "ticker" rather than "symbol" but we keep `symbol` as the canonical field. */
  initialBuy: initialBuyField,
});

export type PumpFunValues = z.infer<typeof pumpFunSchema>;
