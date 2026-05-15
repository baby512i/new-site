export type CreateTokenActionErrorCode =
  | "NO_PUBLIC_KEY"
  | "USER_REJECTED"
  | "API_UNAVAILABLE"
  | "INVALID_PAYLOAD"
  | "UNKNOWN";

export const ACTION_ERROR_MESSAGES: Record<
  CreateTokenActionErrorCode,
  string
> = {
  NO_PUBLIC_KEY: "Connect your wallet before creating the token.",
  USER_REJECTED: "Transaction was rejected in your wallet.",
  API_UNAVAILABLE:
    "Transaction builder is currently unavailable. Try again later.",
  INVALID_PAYLOAD:
    "Some token settings are invalid. Review the highlighted fields.",
  UNKNOWN:
    "Something went wrong while preparing the token creation transaction.",
};

export function getActionErrorMessage(
  code: CreateTokenActionErrorCode,
): string {
  return ACTION_ERROR_MESSAGES[code];
}

/**
 * Map thrown errors from the action runner into user-safe toast copy.
 * Never surfaces raw API codes or technical strings in the UI.
 */
export function resolveCreateTokenActionErrorCode(
  error: unknown,
): CreateTokenActionErrorCode {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "wallet-not-connected" || code === "no-signing-provider") {
      return "NO_PUBLIC_KEY";
    }
    if (code === "api-error") {
      return "API_UNAVAILABLE";
    }
  }

  if (error instanceof Error) {
    const lower = error.message.toLowerCase();
    if (
      lower.includes("reject") ||
      lower.includes("denied") ||
      lower.includes("cancel")
    ) {
      return "USER_REJECTED";
    }
    if (
      lower.includes("public_dxra_core_api_url") ||
      lower.includes("not configured") ||
      lower.includes("unavailable") ||
      lower.includes("network") ||
      lower.includes("fetch")
    ) {
      return "API_UNAVAILABLE";
    }
    if (
      lower.includes("invalid") ||
      lower.includes("validation") ||
      lower.includes("payload")
    ) {
      return "INVALID_PAYLOAD";
    }
    if (
      lower.includes("wallet") &&
      (lower.includes("connect") || lower.includes("not completed"))
    ) {
      return "NO_PUBLIC_KEY";
    }
  }

  return "UNKNOWN";
}
