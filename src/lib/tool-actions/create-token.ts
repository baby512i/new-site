import { toPayload } from "../validation/create-token/to-payload";
import type { CreateTokenValues } from "../validation/create-token/create-token.schema";
import type { CreateTokenSummary } from "../dxra-api/create-token";
import {
  buildCreateTokenTransaction,
  DxraCoreApiError,
} from "../dxra-api/create-token";
import {
  getStoredSolanaNetwork,
  type SolanaNetworkValue,
} from "../network/solana-network";

/**
 * Orchestrates the full Create Token flow.
 *
 * Strict ordering of steps:
 *  1. validate values (caller already did this via Zod)
 *  2. lazy-load wallet client + ensure session
 *  3. ask dxra-core-api to build the unsigned transaction
 *  4. lazy-load Solana web3 only to deserialize the tx + sign with wallet
 *  5. submit signed transaction
 *  6. poll for confirmation
 *
 * Wallet/Reown/Solana imports MUST be dynamic so the public form bundle does
 * not pull them in.
 */

export type CreateTokenStage =
  | "checking-wallet"
  | "preparing-transaction"
  | "awaiting-signature"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

export interface CreateTokenProgressEvent {
  stage: CreateTokenStage;
  message?: string;
}

export interface CreateTokenResult {
  signature: string;
  mintAddress?: string;
  summary: CreateTokenSummary;
  network: SolanaNetworkValue;
}

export interface CreateTokenActionOptions {
  values: CreateTokenValues;
  /** Raw image File when present (kept outside Zod state). */
  imageFile?: File | null;
  /** Optional override; defaults to the user's stored Solana network. */
  network?: SolanaNetworkValue;
  onProgress?: (event: CreateTokenProgressEvent) => void;
  signal?: AbortSignal;
}

/**
 * Run the full Create Token flow.
 * The form island calls this only after the user clicks the action button.
 */
export async function runCreateTokenAction(
  options: CreateTokenActionOptions,
): Promise<CreateTokenResult> {
  const { values, imageFile, onProgress, signal } = options;
  const network = options.network ?? getStoredSolanaNetwork();

  emit(onProgress, { stage: "checking-wallet" });

  const { walletAddress, walletClient } = await connectWallet();

  emit(onProgress, { stage: "preparing-transaction" });

  const payload = toPayload(values);

  const apiResponse = await buildCreateTokenTransaction(
    {
      payload,
      network,
      walletAddress,
      imageFile: imageFile ?? null,
    },
    { signal },
  );

  emit(onProgress, { stage: "awaiting-signature" });

  const transaction = await deserializeTransaction(
    apiResponse.transaction.transactionBase64,
  );

  const signedTx = await walletClient.signTransaction(transaction);

  emit(onProgress, { stage: "submitting" });

  const signature = await submitSignedTransaction(signedTx, network);

  emit(onProgress, { stage: "confirming" });

  await confirmSignature(signature, network, {
    blockhash: apiResponse.transaction.blockhash,
    lastValidBlockHeight: apiResponse.transaction.lastValidBlockHeight,
  });

  emit(onProgress, { stage: "success" });

  return {
    signature,
    mintAddress: apiResponse.summary.mintAddress,
    summary: apiResponse.summary,
    network,
  };
}

function emit(
  onProgress: CreateTokenActionOptions["onProgress"],
  event: CreateTokenProgressEvent,
) {
  try {
    onProgress?.(event);
  } catch {
    // Caller-side notification errors must not break the action flow.
  }
}

/**
 * Lazy wallet bootstrap. Only imported here, never at module top-level.
 * The wallet client interface is intentionally narrow so we don't leak
 * Reown types into the public form bundle.
 */
interface WalletSigningClient {
  signTransaction: <T extends { serialize?: () => Uint8Array }>(tx: T) => Promise<T>;
}

interface ConnectedWallet {
  walletAddress: string;
  walletClient: WalletSigningClient;
}

async function connectWallet(): Promise<ConnectedWallet> {
  const wallet = await import("../wallet/reown-client");

  const status = await wallet.refreshSolanaWalletStatus(1500);
  if (!status.isConnected || !status.address) {
    await wallet.openSolanaConnectModal();
    const after = await wallet.refreshSolanaWalletStatus(2500);
    if (!after.isConnected || !after.address) {
      throw new CreateTokenActionError(
        "Wallet connection was not completed. Please try again.",
        "wallet-not-connected",
      );
    }
    return {
      walletAddress: after.address,
      walletClient: await getWalletSigningClient(),
    };
  }

  return {
    walletAddress: status.address,
    walletClient: await getWalletSigningClient(),
  };
}

/**
 * Wallet signing adapter — returns the active provider's signTransaction API.
 *
 * TODO(create-token): wire this into the real Reown/AppKit signer once we
 * standardise our signing abstraction. This stub reads the injected provider
 * because that path already works for current wallet button flows. It still
 * lazy-imports nothing wallet-specific at module load.
 */
async function getWalletSigningClient(): Promise<WalletSigningClient> {
  const provider = getInjectedProviderForSigning();
  if (!provider) {
    throw new CreateTokenActionError(
      "Connected Solana wallet does not expose a signing API in this environment.",
      "no-signing-provider",
    );
  }
  return {
    async signTransaction(tx) {
      const signed = await provider.signTransaction(tx);
      return signed as typeof tx;
    },
  };
}

interface InjectedSigningProvider {
  signTransaction: (tx: unknown) => Promise<unknown>;
}

interface WindowWithSolana extends Window {
  solana?: InjectedSigningProvider & { isConnected?: boolean };
  phantom?: { solana?: InjectedSigningProvider & { isConnected?: boolean } };
}

function getInjectedProviderForSigning(): InjectedSigningProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as WindowWithSolana;
  const candidate = w.phantom?.solana ?? w.solana;
  if (!candidate || typeof candidate.signTransaction !== "function") return null;
  return candidate;
}

/**
 * Lazy import of @solana/web3.js so the initial form bundle stays SDK-free.
 * The bundle only loads after the user clicks the action button.
 */
async function deserializeTransaction(base64: string) {
  const web3 = await import("@solana/web3.js");
  const bytes = base64ToBytes(base64);
  try {
    return web3.VersionedTransaction.deserialize(bytes);
  } catch {
    return web3.Transaction.from(bytes);
  }
}

async function submitSignedTransaction(
  signedTx: unknown,
  network: SolanaNetworkValue,
): Promise<string> {
  const web3 = await import("@solana/web3.js");
  const connection = new web3.Connection(getRpcEndpoint(web3, network), "confirmed");

  const txWithSerialize = signedTx as { serialize: () => Uint8Array };
  const raw = txWithSerialize.serialize();
  return connection.sendRawTransaction(raw, { skipPreflight: false });
}

async function confirmSignature(
  signature: string,
  network: SolanaNetworkValue,
  hints: { blockhash?: string; lastValidBlockHeight?: number },
) {
  const web3 = await import("@solana/web3.js");
  const connection = new web3.Connection(getRpcEndpoint(web3, network), "confirmed");

  if (hints.blockhash && typeof hints.lastValidBlockHeight === "number") {
    const result = await connection.confirmTransaction(
      {
        signature,
        blockhash: hints.blockhash,
        lastValidBlockHeight: hints.lastValidBlockHeight,
      },
      "confirmed",
    );
    if (result.value.err) {
      throw new CreateTokenActionError(
        `Transaction failed on-chain: ${JSON.stringify(result.value.err)}`,
        "tx-failed",
      );
    }
    return;
  }

  const fallback = await connection.confirmTransaction(signature, "confirmed");
  if (fallback.value.err) {
    throw new CreateTokenActionError(
      `Transaction failed on-chain: ${JSON.stringify(fallback.value.err)}`,
      "tx-failed",
    );
  }
}

function getRpcEndpoint(
  web3: typeof import("@solana/web3.js"),
  network: SolanaNetworkValue,
): string {
  return web3.clusterApiUrl(network === "devnet" ? "devnet" : "mainnet-beta");
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

export type CreateTokenActionErrorCode =
  | "wallet-not-connected"
  | "no-signing-provider"
  | "tx-failed"
  | "api-error"
  | "unknown";

export class CreateTokenActionError extends Error {
  public readonly code: CreateTokenActionErrorCode;
  public readonly cause?: unknown;
  constructor(
    message: string,
    code: CreateTokenActionErrorCode,
    cause?: unknown,
  ) {
    super(message);
    this.name = "CreateTokenActionError";
    this.code = code;
    this.cause = cause;
  }
}

/** Map any unexpected error into a typed CreateTokenActionError. */
export function normalizeCreateTokenError(error: unknown): CreateTokenActionError {
  if (error instanceof CreateTokenActionError) return error;
  if (error instanceof DxraCoreApiError) {
    return new CreateTokenActionError(
      error.message,
      "api-error",
      error,
    );
  }
  if (error instanceof Error) {
    return new CreateTokenActionError(error.message, "unknown", error);
  }
  return new CreateTokenActionError("Unknown error", "unknown", error);
}
