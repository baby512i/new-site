import type { FieldErrors } from "react-hook-form";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";

/**
 * Lookup helpers for RHF errors on a discriminated-union form.
 *
 * `useForm<CreateTokenValues>` produces `FieldErrors<CreateTokenValues>`, but
 * because every platform branch has a different shape, the typed `errors.foo`
 * narrows to never on cross-branch fields. Sections only need:
 *   - "is there an error on key X?"
 *   - "what is the message string for key X?"
 * so we widen `errors` to a string-keyed lookup at the helper boundary.
 */
type ErrorBag = FieldErrors<CreateTokenValues>;

type ErrorEntry = { message?: unknown; type?: unknown } | undefined;

function lookupEntry(errors: ErrorBag, key: string): ErrorEntry {
  return (errors as unknown as Record<string, ErrorEntry>)[key];
}

export function getFieldErrorMessage(
  errors: ErrorBag,
  key: string,
): string | undefined {
  const entry = lookupEntry(errors, key);
  if (!entry) return undefined;
  return typeof entry.message === "string" ? entry.message : undefined;
}

export function isFieldInvalid(errors: ErrorBag, key: string): boolean {
  return Boolean(lookupEntry(errors, key));
}

/**
 * Walk a dotted RHF error path and return the leaf `.message` if present.
 *
 * Handles cases like:
 *   - "transferFeeAuthority.address"
 *   - "withdrawWithheldAuthority.address"
 *   - any nested object/discriminated-union shape RHF produces
 *
 * Returns `undefined` when:
 *   - any segment is missing
 *   - the leaf has no string `message`
 */
export function getNestedFieldErrorMessage(
  errors: unknown,
  path: string,
): string | undefined {
  const parts = path.split(".");
  let current: unknown = errors;

  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  if (
    current &&
    typeof current === "object" &&
    "message" in current &&
    typeof (current as { message?: unknown }).message === "string"
  ) {
    return (current as { message: string }).message;
  }

  return undefined;
}
