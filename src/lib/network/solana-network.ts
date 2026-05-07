export const SOLANA_NETWORK_KEY = "solana-network";

export type SolanaNetworkValue = "mainnet" | "devnet";

export function normalizeSolanaNetwork(value: unknown): SolanaNetworkValue {
  return value === "devnet" ? "devnet" : "mainnet";
}

export function getStoredSolanaNetwork(): SolanaNetworkValue {
  if (typeof window === "undefined") {
    return normalizeSolanaNetwork(import.meta.env.PUBLIC_DEFAULT_NETWORK);
  }

  return normalizeSolanaNetwork(
    window.localStorage.getItem(SOLANA_NETWORK_KEY) ??
      import.meta.env.PUBLIC_DEFAULT_NETWORK,
  );
}

export function setStoredSolanaNetwork(network: SolanaNetworkValue): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOLANA_NETWORK_KEY, normalizeSolanaNetwork(network));
}

export function getSolanaNetworkLabel(network: SolanaNetworkValue): string {
  return network === "devnet" ? "Devnet" : "Mainnet";
}

export function getSolscanAccountUrl(address: string, network: SolanaNetworkValue): string {
  const cluster = network === "devnet" ? "?cluster=devnet" : "";
  return `https://solscan.io/account/${address}${cluster}`;
}
