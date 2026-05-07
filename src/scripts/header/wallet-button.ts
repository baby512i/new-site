const walletButton = document.getElementById("wallet-connect-button");
const walletButtonLabel = document.getElementById("wallet-connect-label");
const walletButtonIcon = document.getElementById("wallet-connect-icon");
const walletDisconnectedLabel = walletButtonLabel?.querySelector?.('[data-wallet-label="disconnected"]') ?? null;
const walletConnectedLabel = walletButtonLabel?.querySelector?.('[data-wallet-label="connected"]') ?? null;
const WALLET_CACHE_KEY = "solana-wallet-address";

type WalletStatus = {
  isConnected?: boolean;
  address?: string;
};

type WalletModule = {
  subscribeSolanaWalletStatus: (onChange: (status: WalletStatus) => void) => Promise<(() => void) | void>;
  refreshSolanaWalletStatus: (maxMs?: number) => Promise<WalletStatus>;
  openSolanaAccountModal: () => Promise<void>;
  openSolanaConnectModal: () => Promise<void>;
};

const isLikelySolanaAddress = (value: unknown) => {
  if (typeof value !== "string") return false;
  if (value.length < 32 || value.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(value);
};

const shortAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

const setWalletButtonState = (state: "disconnected" | "loading" | "connected" | "error", address: string | null) => {
  if (!(walletButton instanceof HTMLButtonElement)) return;
  if (!(walletButtonLabel instanceof HTMLElement)) return;
  if (!(walletDisconnectedLabel instanceof HTMLElement)) return;
  if (!(walletConnectedLabel instanceof HTMLElement)) return;

  walletButton.dataset.walletState = state;
  if (state === "loading") {
    walletButton.setAttribute("aria-busy", "true");
  } else {
    walletButton.removeAttribute("aria-busy");
  }

  if (state === "loading") {
    walletDisconnectedLabel.classList.add("hidden");
    walletConnectedLabel.classList.remove("hidden");
    walletConnectedLabel.textContent = "Loading...";
    walletButtonIcon?.classList.remove("hidden");
    walletButton.setAttribute("aria-label", "Loading Solana wallet");
    return;
  }

  if (address && isLikelySolanaAddress(address)) {
    const short = shortAddress(address);
    walletDisconnectedLabel.classList.add("hidden");
    walletConnectedLabel.classList.remove("hidden");
    walletConnectedLabel.textContent = short;
    walletButtonIcon?.classList.remove("hidden");
    walletButton.setAttribute("aria-label", `Connected Solana wallet ${short}`);
    return;
  }

  walletConnectedLabel.classList.add("hidden");
  walletConnectedLabel.textContent = "";
  walletDisconnectedLabel.classList.remove("hidden");
  walletButtonIcon?.classList.remove("hidden");
  walletButton.setAttribute("aria-label", "Connect Solana wallet");
};

let walletModulePromise: Promise<WalletModule> | null = null;
const loadWalletModule = () => {
  if (!walletModulePromise) {
    walletModulePromise = import("../../lib/wallet/reown-client");
  }
  return walletModulePromise;
};

let walletUnsubscribe: (() => void) | null = null;

const ensureWalletSubscription = async (wallet: WalletModule) => {
  if (walletUnsubscribe) return;
  const unsubscribe = await wallet.subscribeSolanaWalletStatus((status) => {
    if (status?.isConnected && status?.address) {
      setWalletButtonState("connected", status.address);
    } else {
      setWalletButtonState("disconnected", null);
    }
  });
  walletUnsubscribe = typeof unsubscribe === "function" ? unsubscribe : null;
};

const updateFromCache = () => {
  if (!(walletButton instanceof HTMLButtonElement)) return null;
  const cached = window.localStorage.getItem(WALLET_CACHE_KEY);
  if (cached && isLikelySolanaAddress(cached)) {
    setWalletButtonState("connected", cached);
    return cached;
  }
  setWalletButtonState("disconnected", null);
  return null;
};

updateFromCache();

window.addEventListener("storage", (event) => {
  if (event.key !== WALLET_CACHE_KEY) return;
  if (typeof event.newValue === "string" && isLikelySolanaAddress(event.newValue)) {
    setWalletButtonState("connected", event.newValue);
  } else {
    setWalletButtonState("disconnected", null);
  }
});

walletButton?.addEventListener("click", async () => {
  if (!(walletButton instanceof HTMLButtonElement)) return;

  try {
    walletButton.disabled = true;
    setWalletButtonState("loading", null);
    const wallet = await loadWalletModule();
    await ensureWalletSubscription(wallet);
    const status = await wallet.refreshSolanaWalletStatus(2500);
    if (status?.isConnected && status?.address) {
      setWalletButtonState("connected", status.address);
      await wallet.openSolanaAccountModal();
    } else {
      setWalletButtonState("disconnected", null);
      await wallet.openSolanaConnectModal();
    }
  } catch (error) {
    console.error("Failed to open Solana wallet modal:", error);
    setWalletButtonState("error", null);
    window.setTimeout(() => {
      const cached = window.localStorage.getItem(WALLET_CACHE_KEY);
      if (cached && isLikelySolanaAddress(cached)) {
        setWalletButtonState("connected", cached);
      } else {
        setWalletButtonState("disconnected", null);
      }
    }, 1500);
  } finally {
    walletButton.disabled = false;
  }
});
