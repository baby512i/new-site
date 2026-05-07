const walletButton = document.getElementById("wallet-connect-button");
const walletButtonLabel = document.getElementById("wallet-connect-label");
const walletButtonIcon = document.getElementById("wallet-connect-icon");
const walletDisconnectedLabel = walletButtonLabel?.querySelector?.('[data-wallet-label="disconnected"]') ?? null;
const walletConnectedLabel = walletButtonLabel?.querySelector?.('[data-wallet-label="connected"]') ?? null;
const WALLET_CACHE_KEY = "solana-wallet-address";
const WALLET_TOUCHED_KEY = "solana-wallet-touched";
const WALLET_MANUAL_DISCONNECT_KEY = "solana-wallet-manual-disconnect";

type WalletStatus = {
  isConnected?: boolean;
  address?: string;
  shortAddress?: string;
};

type WalletModule = {
  subscribeSolanaWalletStatus: (onChange: (status: WalletStatus) => void) => Promise<(() => void) | void>;
  refreshSolanaWalletStatus: (maxMs?: number) => Promise<WalletStatus>;
  openSolanaConnectModal: () => Promise<void>;
};

type SolanaInjectedPublicKey = {
  toString?: () => string;
};

type SolanaInjectedProvider = {
  publicKey?: SolanaInjectedPublicKey | null;
  isConnected?: boolean;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  off?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

type WindowWithSolana = Window & {
  solana?: SolanaInjectedProvider;
  phantom?: {
    solana?: SolanaInjectedProvider;
  };
};

const isLikelySolanaAddress = (value: unknown) => {
  if (typeof value !== "string") return false;
  if (value.length < 32 || value.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(value);
};

const shortAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;
const getInjectedSolanaProvider = (): SolanaInjectedProvider | null => {
  const typedWindow = window as WindowWithSolana;
  return typedWindow.phantom?.solana ?? typedWindow.solana ?? null;
};

const normalizeInjectedPublicKey = (value: unknown): string | null => {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    "toString" in value &&
    typeof (value as { toString?: unknown }).toString === "function"
  ) {
    const text = (value as { toString: () => string }).toString();
    return text || null;
  }

  return null;
};

const readInjectedSolanaAddress = () => {
  const provider = getInjectedSolanaProvider();
  if (!provider?.isConnected) return null;
  return normalizeInjectedPublicKey(provider.publicKey);
};

const isManuallyDisconnected = () =>
  window.localStorage.getItem(WALLET_MANUAL_DISCONNECT_KEY) === "true";

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
    walletDisconnectedLabel.classList.remove("inline-flex");
    walletConnectedLabel.classList.remove("hidden");
    walletConnectedLabel.classList.add("inline-flex");
    walletConnectedLabel.textContent = "Loading...";
    walletButtonIcon?.classList.remove("hidden");
    walletButton.setAttribute("aria-label", "Loading Solana wallet");
    return;
  }

  if (address && isLikelySolanaAddress(address)) {
    const short = shortAddress(address);
    walletDisconnectedLabel.classList.add("hidden");
    walletDisconnectedLabel.classList.remove("inline-flex");
    walletConnectedLabel.classList.remove("hidden");
    walletConnectedLabel.classList.add("inline-flex");
    walletConnectedLabel.textContent = short;
    walletButtonIcon?.classList.remove("hidden");
    walletButton.setAttribute("aria-label", `Connected Solana wallet ${short}`);
    return;
  }

  walletConnectedLabel.classList.add("hidden");
  walletConnectedLabel.classList.remove("inline-flex");
  walletConnectedLabel.textContent = "";
  walletDisconnectedLabel.classList.remove("hidden");
  walletDisconnectedLabel.classList.add("inline-flex");
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
let currentWalletStatus: WalletStatus = {
  isConnected: false,
};

const applyWalletStatus = (status: WalletStatus) => {
  currentWalletStatus = status;

  if (status?.isConnected && status?.address) {
    window.localStorage.removeItem(WALLET_MANUAL_DISCONNECT_KEY);
    setWalletButtonState("connected", status.address);
  } else {
    setWalletButtonState("disconnected", null);
  }

  window.dispatchEvent(
    new CustomEvent("solana-wallet-status-change", {
      detail: status,
    }),
  );
};

const applyInjectedAddress = (address: string | null) => {
  if (isManuallyDisconnected()) {
    window.localStorage.removeItem(WALLET_CACHE_KEY);
    applyWalletStatus({
      isConnected: false,
    });
    return;
  }

  if (address && isLikelySolanaAddress(address)) {
    window.localStorage.setItem(WALLET_CACHE_KEY, address);

    applyWalletStatus({
      isConnected: true,
      address,
      shortAddress: shortAddress(address),
    });

    return;
  }

  window.localStorage.removeItem(WALLET_CACHE_KEY);

  applyWalletStatus({
    isConnected: false,
  });
};

const subscribeInjectedSolanaProviderLite = () => {
  const provider = getInjectedSolanaProvider();

  if (!provider?.on) return;

  const emitCurrent = () => {
    window.setTimeout(() => {
      applyInjectedAddress(readInjectedSolanaAddress());
    }, 0);

    window.setTimeout(() => {
      applyInjectedAddress(readInjectedSolanaAddress());
    }, 150);

    window.setTimeout(() => {
      applyInjectedAddress(readInjectedSolanaAddress());
    }, 500);
  };

  const handleAccountChanged = (publicKey?: unknown) => {
    const nextAddress =
      normalizeInjectedPublicKey(publicKey) || readInjectedSolanaAddress();

    applyInjectedAddress(nextAddress);
    emitCurrent();
  };

  const handleConnect = (publicKey?: unknown) => {
    const nextAddress =
      normalizeInjectedPublicKey(publicKey) || readInjectedSolanaAddress();

    applyInjectedAddress(nextAddress);
    emitCurrent();
  };

  const handleDisconnect = () => {
    applyInjectedAddress(null);
    emitCurrent();
  };

  provider.on("accountChanged", handleAccountChanged);
  provider.on("connect", handleConnect);
  provider.on("disconnect", handleDisconnect);

  const handleFocusOrVisibility = () => {
    emitCurrent();
  };

  window.addEventListener("focus", handleFocusOrVisibility);
  document.addEventListener("visibilitychange", handleFocusOrVisibility);
};

const ensureWalletSubscription = async (wallet: WalletModule) => {
  if (walletUnsubscribe) return;
  const unsubscribe = await wallet.subscribeSolanaWalletStatus((status) => {
    applyWalletStatus(status);
  });
  walletUnsubscribe = typeof unsubscribe === "function" ? unsubscribe : null;
};

const updateFromCache = () => {
  if (!(walletButton instanceof HTMLButtonElement)) return null;

  if (isManuallyDisconnected()) {
    window.localStorage.removeItem(WALLET_CACHE_KEY);
    currentWalletStatus = { isConnected: false };
    setWalletButtonState("disconnected", null);
    return null;
  }

  const cached = window.localStorage.getItem(WALLET_CACHE_KEY);
  if (cached && isLikelySolanaAddress(cached)) {
    currentWalletStatus = {
      isConnected: true,
      address: cached,
      shortAddress: shortAddress(cached),
    };
    setWalletButtonState("connected", cached);
    return cached;
  }
  currentWalletStatus = { isConnected: false };
  setWalletButtonState("disconnected", null);
  return null;
};

updateFromCache();
subscribeInjectedSolanaProviderLite();

window.addEventListener("storage", (event) => {
  if (event.key !== WALLET_CACHE_KEY) return;
  if (typeof event.newValue === "string" && isLikelySolanaAddress(event.newValue)) {
    applyWalletStatus({
      isConnected: true,
      address: event.newValue,
      shortAddress: shortAddress(event.newValue),
    });
  } else {
    applyWalletStatus({
      isConnected: false,
    });
  }
});

window.addEventListener("solana-wallet-status-change", (event) => {
  const status = (event as CustomEvent<WalletStatus>).detail;

  currentWalletStatus = status;

  if (status?.isConnected && status?.address) {
    setWalletButtonState("connected", status.address);
    return;
  }

  const cached = window.localStorage.getItem(WALLET_CACHE_KEY);

  if (cached && isLikelySolanaAddress(cached)) {
    setWalletButtonState("connected", cached);
    return;
  }

  setWalletButtonState("disconnected", null);
});

walletButton?.addEventListener("click", async () => {
  if (!(walletButton instanceof HTMLButtonElement)) return;

  try {
    window.sessionStorage.setItem(WALLET_TOUCHED_KEY, "true");
    window.dispatchEvent(new CustomEvent("solana-wallet-touched"));
    window.localStorage.removeItem(WALLET_MANUAL_DISCONNECT_KEY);

    const hasLiveConnectedStatus =
      currentWalletStatus.isConnected &&
      currentWalletStatus.address &&
      isLikelySolanaAddress(currentWalletStatus.address);

    if (hasLiveConnectedStatus) {
      window.dispatchEvent(
        new CustomEvent("solana-wallet-account-menu-open", {
          detail: currentWalletStatus,
        }),
      );

      return;
    }

    const cached = window.localStorage.getItem(WALLET_CACHE_KEY);
    const hasCachedAddress = cached && isLikelySolanaAddress(cached);

    if (hasCachedAddress) {
      walletButton.disabled = true;
      setWalletButtonState("loading", null);

      const wallet = await loadWalletModule();
      await ensureWalletSubscription(wallet);

      const refreshed = await wallet.refreshSolanaWalletStatus(700);

      if (refreshed.isConnected && refreshed.address) {
        applyWalletStatus(refreshed);

        window.dispatchEvent(
          new CustomEvent("solana-wallet-account-menu-open", {
            detail: refreshed,
          }),
        );

        return;
      }

      window.localStorage.removeItem(WALLET_CACHE_KEY);
      applyWalletStatus({ isConnected: false });
    }

    walletButton.disabled = true;
    setWalletButtonState("loading", null);
    const wallet = await loadWalletModule();
    await ensureWalletSubscription(wallet);
    const beforeOpenStatus = await wallet.refreshSolanaWalletStatus(900);

    if (beforeOpenStatus?.isConnected && beforeOpenStatus?.address) {
      applyWalletStatus(beforeOpenStatus);

      window.dispatchEvent(
        new CustomEvent("solana-wallet-account-menu-open", {
          detail: beforeOpenStatus,
        }),
      );

      return;
    }

    setWalletButtonState("disconnected", null);

    await wallet.openSolanaConnectModal();

    const afterOpenStatus = await wallet.refreshSolanaWalletStatus(1800);
    applyWalletStatus(afterOpenStatus);
  } catch (error) {
    console.error("Failed to open Solana wallet modal:", error);
    setWalletButtonState("error", null);
    window.setTimeout(() => {
      updateFromCache();
    }, 1500);
  } finally {
    walletButton.disabled = false;
  }
});
