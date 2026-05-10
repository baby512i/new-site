import { z } from "zod";
import {
  commonTokenSchema,
  decimalsField,
  initialSupplyField,
} from "./common.schema";

export const splTokenSchema = commonTokenSchema.extend({
  platform: z.literal("spl"),
  decimals: decimalsField,
  initialSupply: initialSupplyField,
  revokeMintAuthority: z.boolean().default(false),
  revokeFreezeAuthority: z.boolean().default(false),
  makeImmutable: z.boolean().default(false),
});

export type SplTokenValues = z.infer<typeof splTokenSchema>;
