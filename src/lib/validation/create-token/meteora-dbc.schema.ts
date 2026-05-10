import { z } from "zod";
import { commonTokenSchema } from "./common.schema";

/**
 * Meteora DBC requires a curve preset choice. Real preset list comes from
 * dxra-core-api; we accept a known-shape string here and let the backend
 * reject unknown presets so the form does not need to track Meteora's catalogue.
 *
 * TODO(create-token): replace with real preset enum once backend exposes it.
 */
export const METEORA_DBC_CURVE_PRESETS = [
  "balanced",
  "steep",
  "gentle",
] as const;

export const meteoraDbcSchema = commonTokenSchema.extend({
  platform: z.literal("meteoraDbc"),
  curvePreset: z.enum(METEORA_DBC_CURVE_PRESETS, {
    message: "Choose a bonding curve preset.",
  }),
});

export type MeteoraDbcValues = z.infer<typeof meteoraDbcSchema>;
