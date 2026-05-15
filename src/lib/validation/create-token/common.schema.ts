import { z } from "zod";

/**
 * Validation primitives shared across every create-token platform.
 *
 * Rules:
 * - amount fields are stored as strings (no JS number precision loss)
 * - public key validation is a lightweight base58 check (no @solana/web3.js)
 * - URLs are optional; if provided they must parse via URL()
 * - hidden fields are stripped in toPayload(), not in these schemas
 */

export const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;

/** Loose Solana public key check that does not require Solana SDKs. */
export const solanaPublicKeyString = z
  .string()
  .trim()
  .refine(
    (value) => value.length >= 32 && value.length <= 44 && BASE58_REGEX.test(value),
    {
      message: "Enter a valid Solana address (base58, 32-44 chars).",
    },
  );

const trimmedString = (max: number, message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .max(max, `Maximum ${max} characters.`);

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximum ${max} characters.`)
    .optional()
    .transform((value) => (value === undefined || value === "" ? undefined : value));

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Decimals stored as a string in the form, parsed/validated as integer 0..9.
 * Token-2022 supports 0..9 as well; Pump.fun / launchpads override this entirely.
 */
export const decimalsField = z
  .string()
  .trim()
  .refine((value) => value.length > 0, { message: "Decimals is required." })
  .refine((value) => /^\d+$/.test(value), {
    message: "Decimals must be a whole number.",
  })
  .refine(
    (value) => {
      const n = Number(value);
      return Number.isInteger(n) && n >= 0 && n <= 9;
    },
    { message: "Decimals must be between 0 and 9." },
  );

/**
 * Initial supply stays a string. We only validate that it's a positive integer
 * up to a reasonable max-character length — final big-number validation happens
 * server-side in dxra-core-api with the chosen decimals.
 */
export const initialSupplyField = z
  .string()
  .trim()
  .refine((value) => value.length > 0, { message: "Initial supply is required." })
  .refine((value) => /^\d+$/.test(value), {
    message: "Initial supply must be a whole number.",
  })
  .refine((value) => value.length <= 24, {
    message: "Initial supply is too large.",
  })
  .refine((value) => value !== "0", {
    message: "Initial supply must be greater than zero.",
  });

const commonTokenFields = {
  tokenName: trimmedString(32, "Token name is required."),
  symbol: trimmedString(10, "Symbol is required.").refine(
    (value) => /^[A-Za-z0-9]+$/.test(value),
    { message: "Symbol can only contain letters and numbers." },
  ),
  description: optionalString(500),
  includeSocialLinks: z.boolean().default(false),
  website: optionalString(300),
  telegram: optionalString(80),
  twitter: optionalString(80),
  includeAdvancedOptions: z.boolean().default(false),
  includeCreatorInfo: z.boolean().default(false),
  creatorName: optionalString(64),
  creatorWebsite: optionalString(300),
  includeVanityAddress: z.boolean().default(false),
  vanityPrefix: optionalString(4),
  vanitySuffix: optionalString(4),
  vanityCaseSensitive: z.boolean().default(false),
};

/**
 * NOTE about the `image` field:
 * It is intentionally NOT in the schema. The image is a `File` and is kept in
 * local React state inside the form island, then passed to the action runner.
 */
export const commonTokenSchema = z
  .object(commonTokenFields)
  .superRefine((data, ctx) => {
    if (data.includeSocialLinks) {
      if (data.website && !isValidHttpUrl(data.website)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid http(s) URL.",
          path: ["website"],
        });
      }
    }

    if (data.includeAdvancedOptions && data.includeCreatorInfo) {
      if (!data.creatorName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Creator / team name is required when creator info is enabled.",
          path: ["creatorName"],
        });
      }
      if (data.creatorWebsite && !isValidHttpUrl(data.creatorWebsite)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a valid http(s) URL.",
          path: ["creatorWebsite"],
        });
      }
    }

    if (data.includeAdvancedOptions && data.includeVanityAddress) {
      const prefix = data.vanityPrefix?.trim() ?? "";
      const suffix = data.vanitySuffix?.trim() ?? "";
      if (!prefix && !suffix) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a prefix or suffix for the custom address.",
          path: ["vanityPrefix"],
        });
      }
      if (prefix && !BASE58_REGEX.test(prefix)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Use base58 characters only (no 0, O, I, l).",
          path: ["vanityPrefix"],
        });
      }
      if (suffix && !BASE58_REGEX.test(suffix)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Use base58 characters only (no 0, O, I, l).",
          path: ["vanitySuffix"],
        });
      }
      const combined = prefix.length + suffix.length;
      if (combined > 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Prefix and suffix combined must be 4 characters or fewer.",
          path: ["vanityPrefix"],
        });
      }
    }
  });

export type CommonTokenValues = z.infer<typeof commonTokenSchema>;
