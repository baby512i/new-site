import type { ActionButtonState } from "../../components/ActionButton";

export type CreateTokenActionStage =
  | "idle"
  | "preparing"
  | "signing"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

export interface CreateTokenActionFlowState {
  stage: CreateTokenActionStage;
  message?: string;
  signature?: string;
  mintAddress?: string;
}

export interface CreateTokenActionReadinessInput {
  /** RHF `formState.isValid` for the active platform schema. */
  isValid: boolean;
  /** True when at least one user interaction has happened. */
  hasInteracted: boolean;
  /** True when the wallet bridge reports a connected Solana wallet. */
  walletConnected: boolean;
  /** Live action flow state from the orchestrator. */
  actionState: CreateTokenActionFlowState;
}

export interface CreateTokenActionReadiness {
  state: ActionButtonState;
  label: string;
  /** Optional helper line rendered under the button. */
  helper?: string;
  /** True when the button should accept clicks. */
  canSubmit: boolean;
}

/**
 * Single source of truth for the action button's label, ButtonState, helper
 * text, and clickable status. Keeps the form island free of nested ternaries.
 *
 * UX rules followed here:
 * - Wallet connection is NEVER required to fill or submit-attempt the form.
 *   When the form is valid and the wallet is disconnected, the button is
 *   active and the click triggers the wallet connect modal inside the action.
 * - "Complete required fields" only shows after the user has touched the form
 *   at least once, so the initial state does not feel hostile.
 */
export function getCreateTokenActionReadiness(
  input: CreateTokenActionReadinessInput,
): CreateTokenActionReadiness {
  const { isValid, hasInteracted, walletConnected, actionState } = input;

  switch (actionState.stage) {
    case "preparing":
      return {
        state: "preparing",
        label: "Creating unsigned transaction…",
        canSubmit: false,
      };
    case "signing":
      return {
        state: "signing",
        label: "Confirm in wallet…",
        canSubmit: false,
      };
    case "submitting":
      return {
        state: "submitting",
        label: "Submitting transaction…",
        canSubmit: false,
      };
    case "confirming":
      return {
        state: "submitting",
        label: "Confirming transaction…",
        canSubmit: false,
      };
    case "success":
      return {
        state: "success",
        label: "Token created",
        helper: actionState.signature
          ? `Signature ${truncateMiddle(actionState.signature)}`
          : undefined,
        canSubmit: false,
      };
    case "error":
      return {
        state: "error",
        label: walletConnected
          ? "Try again"
          : "Connect wallet and try again",
        helper: actionState.message,
        canSubmit: true,
      };
    case "idle":
    default:
      break;
  }

  if (!isValid) {
    return {
      state: "incomplete",
      label: hasInteracted
        ? "Complete required fields"
        : "Review and create token",
      canSubmit: false,
    };
  }

  if (!walletConnected) {
    return {
      state: "wallet-required",
      label: "Connect wallet to create token",
      helper: "Wallet is requested only when you click. The form is non-custodial.",
      canSubmit: true,
    };
  }

  return {
    state: "ready",
    label: "Review and create token",
    canSubmit: true,
  };
}

function truncateMiddle(value: string, head = 8, tail = 8): string {
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
