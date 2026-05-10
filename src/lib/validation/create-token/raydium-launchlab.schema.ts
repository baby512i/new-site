import { z } from "zod";
import { commonTokenSchema } from "./common.schema";

/**
 * Raydium LaunchLab parameters depend on the platform's current SDK shape.
 * Keep launch settings minimal in this first pass — backend can expand later.
 *
 * TODO(create-token): tighten launchSettings once dxra-core-api confirms shape.
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

const launchSettings = z
  .object({
    quote: z.enum(["SOL"]).default("SOL"),
  })
  .partial()
  .optional();

export const raydiumLaunchlabSchema = commonTokenSchema.extend({
  platform: z.literal("raydiumLaunchlab"),
  launchSettings,
  initialBuy: initialBuyField,
});

export type RaydiumLaunchlabValues = z.infer<typeof raydiumLaunchlabSchema>;
