import {
  normalizeSolanaNetwork,
  type SolanaNetworkValue,
} from "../../lib/network/solana-network";

const WALLET_CACHE_KEY = "solana-wallet-address";
const WALLET_TOUCHED_KEY = "solana-wallet-touched";

type WalletStatus = {
  isConnected?: boolean;
  address?: string;
};

type WalletModule = {
  switchSolanaAppKitNetwork: (network: SolanaNetworkValue) => Promise<WalletStatus>;
};

let walletModulePromise: Promise<WalletModule> | null = null;

let walletWasTouched =
  window.sessionStorage.getItem(WALLET_TOUCHED_KEY) === "true";

window.addEventListener("solana-wallet-touched", () => {
  walletWasTouched = true;
  window.sessionStorage.setItem(WALLET_TOUCHED_KEY, "true");
});

const hasCachedWallet = () => {
  try {
    const cached = window.localStorage.getItem(WALLET_CACHE_KEY);
    return Boolean(cached);
  } catch {
    return false;
  }
};

const shouldSyncReownNow = () => {
  return walletWasTouched || hasCachedWallet();
};

const loadWalletModule = () => {
  if (!walletModulePromise) {
    walletModulePromise = import("../../lib/wallet/reown-client");
  }

  return walletModulePromise;
};

window.addEventListener("solana-network-change", async (event) => {
  const network = normalizeSolanaNetwork(
    (event as CustomEvent<{ network?: string }>).detail?.network,
  );

  if (!shouldSyncReownNow()) {
    return;
  }

  try {
    const wallet = await loadWalletModule();
    const status = await wallet.switchSolanaAppKitNetwork(network);

    window.dispatchEvent(
      new CustomEvent("solana-wallet-status-change", {
        detail: status,
      }),
    );
  } catch (error) {
    console.warn("Failed to sync Reown network:", error);
  }
});
