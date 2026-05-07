import {
  getSolanaNetworkLabel,
  getSolscanAccountUrl,
  getStoredSolanaNetwork,
} from "../../lib/network/solana-network";

type WalletStatus = {
  isConnected?: boolean;
  address?: string;
  shortAddress?: string;
};

type WalletModule = {
  disconnectSolanaWallet: () => Promise<void>;
  openSolanaConnectModal: () => Promise<void>;
  refreshSolanaWalletStatus: (maxMs?: number) => Promise<WalletStatus>;
};

const WALLET_CACHE_KEY = "solana-wallet-address";
const WALLET_TOUCHED_KEY = "solana-wallet-touched";
const WALLET_MANUAL_DISCONNECT_KEY = "solana-wallet-manual-disconnect";

const dialog = document.getElementById("wallet-account-dialog");
const closeButton = document.getElementById("wallet-account-close");
const shortAddressElement = document.getElementById("wallet-account-short-address");
const fullAddressElement = document.getElementById("wallet-account-full-address");
const networkElement = document.getElementById("wallet-account-network");
const statusElement = document.getElementById("wallet-account-status");
const statusDotElement = document.getElementById("wallet-account-status-dot");
const copyButton = document.getElementById("wallet-account-copy");
const copyState = document.getElementById("wallet-account-copy-state");
const explorerLink = document.getElementById("wallet-account-explorer");
const changeButton = document.getElementById("wallet-account-change");
const disconnectButton = document.getElementById("wallet-account-disconnect");

const shortAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

let currentStatus: WalletStatus = {
  isConnected: false,
};

let walletModulePromise: Promise<WalletModule> | null = null;

const loadWalletModule = () => {
  if (!walletModulePromise) {
    walletModulePromise = import("../../lib/wallet/reown-client");
  }

  return walletModulePromise;
};

const isLikelySolanaAddress = (value: unknown) => {
  if (typeof value !== "string") return false;
  if (value.length < 32 || value.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(value);
};

const getCurrentAddress = () => {
  if (
    currentStatus.isConnected &&
    currentStatus.address &&
    isLikelySolanaAddress(currentStatus.address)
  ) {
    return currentStatus.address;
  }

  return null;
};

const updateMenu = () => {
  const address = getCurrentAddress();
  const network = getStoredSolanaNetwork();

  if (shortAddressElement instanceof HTMLElement) {
    shortAddressElement.textContent = address ? shortAddress(address) : "Not connected";
  }

  if (fullAddressElement instanceof HTMLElement) {
    fullAddressElement.textContent = address || "";
  }

  if (networkElement instanceof HTMLElement) {
    networkElement.textContent = getSolanaNetworkLabel(network);
  }

  if (statusElement instanceof HTMLElement) {
    statusElement.textContent = address ? "Connected" : "Disconnected";
    statusElement.classList.toggle("text-[var(--color-success)]", Boolean(address));
    statusElement.classList.toggle("text-[var(--color-text-muted)]", !address);
  }

  if (statusDotElement instanceof HTMLElement) {
    statusDotElement.classList.toggle("bg-[var(--color-success)]", Boolean(address));
    statusDotElement.classList.toggle("bg-[var(--color-text-muted)]", !address);
  }

  if (explorerLink instanceof HTMLAnchorElement) {
    if (address) {
      explorerLink.href = getSolscanAccountUrl(address, network);
      explorerLink.removeAttribute("aria-disabled");
    } else {
      explorerLink.href = "#";
      explorerLink.setAttribute("aria-disabled", "true");
    }
  }
};

const openDialog = () => {
  updateMenu();

  if (dialog instanceof HTMLDialogElement && !dialog.open) {
    dialog.showModal();
  }
};

const closeDialog = () => {
  if (dialog instanceof HTMLDialogElement && dialog.open) {
    dialog.close();
  }
};

window.addEventListener("solana-wallet-account-menu-open", (event) => {
  currentStatus = {
    ...currentStatus,
    ...(event as CustomEvent<WalletStatus>).detail,
  };

  openDialog();
});

window.addEventListener("solana-wallet-status-change", (event) => {
  const nextStatus = (event as CustomEvent<WalletStatus>).detail;

  currentStatus =
    nextStatus?.isConnected && nextStatus.address
      ? nextStatus
      : { isConnected: false };

  updateMenu();

  if (!currentStatus.isConnected) {
    closeDialog();
  }
});

window.addEventListener("solana-network-change", () => {
  updateMenu();
});

closeButton?.addEventListener("click", closeDialog);

dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) {
    closeDialog();
  }
});

copyButton?.addEventListener("click", async () => {
  const address = getCurrentAddress();

  if (!address) return;

  await navigator.clipboard.writeText(address);

  if (copyState instanceof HTMLElement) {
    copyState.textContent = "Copied";
    window.setTimeout(() => {
      copyState.textContent = "Copy";
    }, 1200);
  }
});

disconnectButton?.addEventListener("click", async () => {
  if (disconnectButton instanceof HTMLButtonElement) {
    disconnectButton.disabled = true;
  }

  try {
    const wallet = await loadWalletModule();
    await wallet.disconnectSolanaWallet();

    currentStatus = { isConnected: false };
    window.localStorage.setItem(WALLET_MANUAL_DISCONNECT_KEY, "true");
    window.localStorage.removeItem(WALLET_CACHE_KEY);

    window.dispatchEvent(
      new CustomEvent("solana-wallet-status-change", {
        detail: currentStatus,
      }),
    );

    closeDialog();
  } finally {
    if (disconnectButton instanceof HTMLButtonElement) {
      disconnectButton.disabled = false;
    }
  }
});

changeButton?.addEventListener("click", async () => {
  if (changeButton instanceof HTMLButtonElement) {
    changeButton.disabled = true;
  }

  try {
    window.sessionStorage.setItem(WALLET_TOUCHED_KEY, "true");
    window.localStorage.removeItem(WALLET_MANUAL_DISCONNECT_KEY);
    window.dispatchEvent(new CustomEvent("solana-wallet-touched"));

    const wallet = await loadWalletModule();

    await wallet.disconnectSolanaWallet();
    await new Promise((resolve) => window.setTimeout(resolve, 150));

    closeDialog();

    await wallet.openSolanaConnectModal();
    const status = await wallet.refreshSolanaWalletStatus(1600);

    currentStatus = status;

    window.dispatchEvent(
      new CustomEvent("solana-wallet-status-change", {
        detail: status,
      }),
    );
  } finally {
    if (changeButton instanceof HTMLButtonElement) {
      changeButton.disabled = false;
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDialog();
  }
});

updateMenu();
