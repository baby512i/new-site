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

const optionalUrl = z
  .string()
  .trim()
  .max(300, "Maximum 300 characters.")
  .optional()
  .transform((value) => (value === undefined || value === "" ? undefined : value))
  .refine(
    (value) => {
      if (value === undefined) return true;
      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    },
    { message: "Enter a valid http(s) URL." },
  );

const optionalSocialHandle = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximum ${max} characters.`)
    .optional()
    .transform((value) => (value === undefined || value === "" ? undefined : value));

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

/**
 * NOTE about the `image` field:
 * It is intentionally NOT in the schema. The image is a `File` and is kept in
 * local React state inside the form island, then passed to the action runner.
 * Including it as `z.unknown()` here used to break RHF's `DefaultValues` type
 * inference (RHF expects `{} | undefined`, not `unknown | undefined`).
 *
 * The dxra-api wrapper (`src/lib/dxra-api/create-token.ts`) is responsible for
 * attaching the `image` descriptor to the outgoing payload, so the Zod schema
 * does not need to know about it.
 */
export const commonTokenSchema = z.object({
  tokenName: trimmedString(32, "Token name is required."),
  symbol: trimmedString(10, "Symbol is required.").refine(
    (value) => /^[A-Za-z0-9]+$/.test(value),
    { message: "Symbol can only contain letters and numbers." },
  ),
  description: optionalString(500),
  website: optionalUrl,
  telegram: optionalSocialHandle(80),
  twitter: optionalSocialHandle(80),
});

export type CommonTokenValues = z.infer<typeof commonTokenSchema>;
