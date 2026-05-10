import type { SolanaNetworkValue } from "../network/solana-network";
import type {
  CreateTokenPayload,
  CreateTokenImageDescriptor,
} from "../validation/create-token/to-payload";

/**
 * Thin client for the dxra-core-api `create-token` endpoint.
 *
 * Responsibilities:
 * - turn a typed payload into a request to dxra-core-api
 * - return unsigned transaction data + summary metadata
 *
 * Non-responsibilities:
 * - building/serialising transactions (server does it)
 * - signing (handled by the wallet flow inside src/lib/tool-actions)
 * - wallet/Reown imports (must NOT live in this file)
 */

export interface CreateTokenFeeBreakdown {
  /** Lamports the wallet pays to Solana for rent. */
  rentLamports?: number;
  /** Lamports the wallet pays as platform fee. */
  platformFeeLamports?: number;
  /** Lamports going to the underlying launchpad (Pump.fun, LaunchLab, DBC). */
  launchpadFeeLamports?: number;
  /** Total in lamports if the API returns it pre-aggregated. */
  totalLamports?: number;
  /** Pre-formatted SOL string ready for display, when API provides it. */
  formattedSol?: string;
}

export interface CreateTokenSummary {
  /** Future mint address as base58, when the API can pre-derive it. */
  mintAddress?: string;
  /** Estimated network rent + fee breakdown. */
  fees?: CreateTokenFeeBreakdown;
  /** Free-form notes the API wants to surface in the UI. */
  notes?: string[];
}

export interface UnsignedTransactionEnvelope {
  /** Base64-encoded versioned/legacy transaction bytes. */
  transactionBase64: string;
  /** Optional last valid block height for retry/expiry handling. */
  lastValidBlockHeight?: number;
  /** Optional recent blockhash echoed back from the server. */
  blockhash?: string;
}

export interface CreateTokenApiResponse {
  /** One unsigned transaction. Some platforms may return a sequence later. */
  transaction: UnsignedTransactionEnvelope;
  summary: CreateTokenSummary;
}

export interface CreateTokenRequest {
  payload: CreateTokenPayload;
  network: SolanaNetworkValue;
  walletAddress: string;
  /** Raw image File when present — sent as multipart for Pinata-style uploads. */
  imageFile?: File | null;
}

export class DxraCoreApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "DxraCoreApiError";
  }
}

function getApiBaseUrl(): string {
  const raw = import.meta.env.PUBLIC_DXRA_CORE_API_URL?.trim();
  if (!raw) {
    throw new DxraCoreApiError(
      "PUBLIC_DXRA_CORE_API_URL is not configured. Set it in .env to enable token creation.",
    );
  }
  return raw.replace(/\/$/, "");
}

function describeImageDescriptor(file?: File | null): CreateTokenImageDescriptor {
  if (file) {
    return {
      kind: "file",
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    };
  }
  return { kind: "none" };
}

/**
 * Build the unsigned transaction for the requested platform via dxra-core-api.
 * The wallet client signs/submits the result — this function never imports
 * wallet or Solana SDKs.
 */
export async function buildCreateTokenTransaction(
  request: CreateTokenRequest,
  init?: { signal?: AbortSignal },
): Promise<CreateTokenApiResponse> {
  const base = getApiBaseUrl();
  const endpoint = `${base}/v1/create-token`;

  const hasImage = Boolean(request.imageFile);

  const requestBody = {
    network: request.network,
    walletAddress: request.walletAddress,
    payload: {
      ...request.payload,
      image: describeImageDescriptor(request.imageFile),
    },
  };

  let response: Response;
  if (hasImage) {
    const formData = new FormData();
    formData.append("body", new Blob([JSON.stringify(requestBody)], { type: "application/json" }));
    if (request.imageFile) {
      formData.append("image", request.imageFile);
    }

    response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      signal: init?.signal,
    });
  } else {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: init?.signal,
    });
  }

  if (!response.ok) {
    const body = await safeReadBody(response);
    throw new DxraCoreApiError(
      `dxra-core-api create-token failed (${response.status})`,
      response.status,
      body,
    );
  }

  const body = (await response.json()) as Partial<CreateTokenApiResponse>;
  if (!body || !body.transaction || typeof body.transaction.transactionBase64 !== "string") {
    throw new DxraCoreApiError(
      "dxra-core-api returned an unexpected response shape (missing transaction).",
      response.status,
      body,
    );
  }

  return {
    transaction: body.transaction,
    summary: body.summary ?? {},
  };
}

async function safeReadBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return undefined;
  }
}
