import { createAppKit } from "@reown/appkit";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { solana, solanaDevnet } from "@reown/appkit/networks";
import {
  getStoredSolanaNetwork,
  normalizeSolanaNetwork,
  type SolanaNetworkValue,
} from "../network/solana-network";

type AppKitInstance = ReturnType<typeof createAppKit>;
type ThemeMode = "light" | "dark";

export const SOLANA_NAMESPACE = "solana" as const;
const SOLANA_WALLET_CACHE_KEY = "solana-wallet-address";
const SOLANA_WALLET_MANUAL_DISCONNECT_KEY = "solana-wallet-manual-disconnect";

let appKit: AppKitInstance | null = null;

/** Explicit tuple keeps AppKit network typing happy. */
const networks = [solana, solanaDevnet] as [typeof solana, typeof solanaDevnet];

export type SolanaWalletStatus = {
  isConnected: boolean;
  address?: string;
  shortAddress?: string;
};

type SolanaInjectedPublicKey = {
  toString?: () => string;
};

type SolanaInjectedProvider = {
  isPhantom?: boolean;
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

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function cacheAddress(address: string | null) {
  if (typeof window === "undefined") return;

  if (!address) {
    window.localStorage.removeItem(SOLANA_WALLET_CACHE_KEY);
    return;
  }

  window.localStorage.setItem(SOLANA_WALLET_CACHE_KEY, address);
}

export function getCachedSolanaWalletAddress() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SOLANA_WALLET_CACHE_KEY);
}

function isManualDisconnectFlagged() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SOLANA_WALLET_MANUAL_DISCONNECT_KEY) === "true";
}

function setManualDisconnectFlag(value: boolean) {
  if (typeof window === "undefined") return;

  if (value) {
    window.localStorage.setItem(SOLANA_WALLET_MANUAL_DISCONNECT_KEY, "true");
    return;
  }

  window.localStorage.removeItem(SOLANA_WALLET_MANUAL_DISCONNECT_KEY);
}

function getInjectedSolanaProvider(): SolanaInjectedProvider | null {
  if (typeof window === "undefined") return null;

  const typedWindow = window as WindowWithSolana;

  if (typedWindow.phantom?.solana) {
    return typedWindow.phantom.solana;
  }

  if (typedWindow.solana) {
    return typedWindow.solana;
  }

  return null;
}

function normalizeInjectedPublicKey(value: unknown): string | null {
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
}

function readInjectedSolanaAddress(): string | null {
  const provider = getInjectedSolanaProvider();

  if (!provider?.isConnected) {
    return null;
  }

  return normalizeInjectedPublicKey(provider.publicKey);
}

function hasSolanaSession(modal: AppKitInstance) {
  const injectedAddress = readInjectedSolanaAddress();

  if (injectedAddress) {
    return true;
  }

  const account = modal.getAccount(SOLANA_NAMESPACE);
  const address = getSolanaAddress(modal);
  return account?.isConnected === true && Boolean(address);
}

/**
 * Resolve the *active* current Solana address.
 * Do NOT prefer `allAccounts.find(...)` because array order can contain stale entries.
 */
export function getSolanaAddress(modal: AppKitInstance) {
  const injectedAddress = readInjectedSolanaAddress();
  if (injectedAddress) {
    return injectedAddress;
  }

  const directAddress = modal.getAddressByChainNamespace(SOLANA_NAMESPACE);
  if (directAddress) return directAddress;

  const account = modal.getAccount(SOLANA_NAMESPACE);

  const caip = account?.caipAddress;
  if (typeof caip === "string" && caip.startsWith(`${SOLANA_NAMESPACE}:`)) {
    const tail = caip.split(":").pop();
    if (tail) return tail;
  }

  const solanaAccounts = account?.allAccounts?.filter(
    (entry) => entry.namespace === SOLANA_NAMESPACE && entry.address,
  );

  return solanaAccounts?.at(-1)?.address;
}

function readSolanaWalletStatus(modal: AppKitInstance): SolanaWalletStatus {
  if (isManualDisconnectFlagged()) {
    cacheAddress(null);
    return {
      isConnected: false,
    };
  }

  const connected = hasSolanaSession(modal);
  const address = connected ? getSolanaAddress(modal) : undefined;

  cacheAddress(address || null);

  return {
    isConnected: connected,
    address,
    shortAddress: address ? shortAddress(address) : undefined,
  };
}

function isAccountPossiblyConnecting(modal: AppKitInstance) {
  const account = modal.getAccount(SOLANA_NAMESPACE);
  const status = account?.status;
  return status === "connecting" || status === "reconnecting";
}

export async function getSolanaWalletStatus(): Promise<SolanaWalletStatus> {
  const modal = initReownAppKit();
  await modal.ready();
  return readSolanaWalletStatus(modal);
}

export async function waitForSolanaWalletStatus(maxMs = 3000): Promise<SolanaWalletStatus> {
  const modal = initReownAppKit();
  await modal.ready();

  const first = readSolanaWalletStatus(modal);

  // If clearly disconnected and not reconnecting, don't wait.
  if (!first.isConnected && !isAccountPossiblyConnecting(modal)) {
    return first;
  }

  const deadline = Date.now() + maxMs;
  let lastAddress = first.address;
  let stableCount = 0;

  while (Date.now() < deadline) {
    await delay(120);
    const next = readSolanaWalletStatus(modal);

    // If we're disconnected and not trying to reconnect, exit quickly.
    if (!next.isConnected && !isAccountPossiblyConnecting(modal)) {
      return next;
    }

    // Address stability: require two consecutive identical reads once connected.
    if (next.isConnected && next.address) {
      if (next.address === lastAddress) {
        stableCount += 1;
        if (stableCount >= 2) return next;
      } else {
        lastAddress = next.address;
        stableCount = 0;
      }
    } else {
      stableCount = 0;
      lastAddress = next.address;
    }
  }

  return readSolanaWalletStatus(modal);
}

export async function refreshSolanaWalletStatus(maxMs = 3000): Promise<SolanaWalletStatus> {
  return await waitForSolanaWalletStatus(maxMs);
}

function getProjectId() {
  const projectId = import.meta.env.PUBLIC_REOWN_PROJECT_ID;

  if (!projectId) {
    throw new Error("Missing PUBLIC_REOWN_PROJECT_ID");
  }

  return projectId;
}

function getSiteUrl() {
  const configured = import.meta.env.PUBLIC_SITE_URL?.trim();

  if (configured && configured !== "https://your-domain.com") {
    return configured;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "http://localhost:4321";
}

function getDefaultNetwork() {
  return getReownSolanaNetwork(getStoredSolanaNetwork());
}

function getReownSolanaNetwork(network: SolanaNetworkValue) {
  return network === "devnet" ? solanaDevnet : solana;
}

function getSiteThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const saved = window.localStorage.getItem("theme");
  if (saved === "dark" || saved === "light") {
    return saved;
  }

  if (window.document.documentElement.classList.contains("dark")) {
    return "dark";
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function syncAppKitThemeMode(modal: AppKitInstance) {
  const themeMode = getSiteThemeMode();

  const maybeSetThemeMode = (modal as unknown as { setThemeMode?: (mode: ThemeMode) => void })
    .setThemeMode;

  if (typeof maybeSetThemeMode === "function") {
    maybeSetThemeMode(themeMode);
  }
}

export function initReownAppKit() {
  if (appKit) {
    syncAppKitThemeMode(appKit);
    return appKit;
  }

  const siteUrl = getSiteUrl();

  const solanaAdapter = new SolanaAdapter();

  appKit = createAppKit({
    adapters: [solanaAdapter],
    networks,
    defaultNetwork: getDefaultNetwork(),
    projectId: getProjectId(),
    metadata: {
      name: "Solana Tools",
      description: "Lightweight Solana tools for token creation, token management, and wallet actions.",
      url: siteUrl,
      icons: [`${siteUrl}/favicon.svg`],
    },
    defaultAccountTypes: {
      solana: "eoa",
    },
    enableNetworkSwitch: true,
    enableReconnect: true,
    enableMobileFullScreen: true,
    enableWalletGuide: true,
    themeMode: getSiteThemeMode(),
    features: {
      analytics: false,
      swaps: false,
      onramp: false,
      email: false,
      socials: [],
      connectMethodsOrder: ["wallet"],
    },

  });

  syncAppKitThemeMode(appKit);
  return appKit;
}

export async function openSolanaConnectModal() {
  setManualDisconnectFlag(false);
  const modal = initReownAppKit();
  syncAppKitThemeMode(modal);
  await modal.ready();
  await modal.open({ view: "Connect", namespace: SOLANA_NAMESPACE });
}

export async function disconnectSolanaWallet(): Promise<void> {
  setManualDisconnectFlag(true);
  const modal = initReownAppKit();

  if ("ready" in modal && typeof modal.ready === "function") {
    await modal.ready();
  }

  const maybeDisconnect = modal as unknown as {
    disconnect?: () => Promise<void> | void;
  };

  if (typeof maybeDisconnect.disconnect === "function") {
    await maybeDisconnect.disconnect();
  }

  cacheAddress(null);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("solana-wallet-status-change", {
        detail: { isConnected: false },
      }),
    );
  }
}

export async function switchSolanaAppKitNetwork(
  network: SolanaNetworkValue,
): Promise<SolanaWalletStatus> {
  const modal = initReownAppKit();

  if ("ready" in modal && typeof modal.ready === "function") {
    await modal.ready();
  }

  const normalizedNetwork = normalizeSolanaNetwork(network);
  const targetNetwork = getReownSolanaNetwork(normalizedNetwork);

  const appKitWithNetworkSwitch = modal as unknown as {
    switchNetwork?: (nextNetwork: typeof solana | typeof solanaDevnet) => Promise<void> | void;
    getCaipNetworkId?: () => string | undefined;
  };

  if (typeof appKitWithNetworkSwitch.switchNetwork !== "function") {
    throw new Error("Reown AppKit switchNetwork is not available.");
  }

  await appKitWithNetworkSwitch.switchNetwork(targetNetwork);
  await delay(150);

  const status = await refreshSolanaWalletStatus(1200);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("solana-wallet-status-change", {
        detail: status,
      }),
    );

    window.dispatchEvent(
      new CustomEvent("solana-appkit-network-synced", {
        detail: {
          network: normalizedNetwork,
          caipNetworkId:
            typeof appKitWithNetworkSwitch.getCaipNetworkId === "function"
              ? appKitWithNetworkSwitch.getCaipNetworkId()
              : undefined,
        },
      }),
    );
  }

  return status;
}

export async function openSolanaNetworkModal() {
  const modal = initReownAppKit();
  syncAppKitThemeMode(modal);
  await modal.ready();
  await modal.open({ view: "Networks" });
}

export async function openSolanaWalletModal() {
  /**
   * Keep this connect-only to avoid stale connected-wallet UI.
   * Connected wallet interactions must use the custom wallet account dialog.
   */
  setManualDisconnectFlag(false);
  const modal = initReownAppKit();
  syncAppKitThemeMode(modal);
  await modal.ready();
  await modal.open({ view: "Connect", namespace: SOLANA_NAMESPACE });
}

export async function subscribeSolanaWalletStatus(onChange: (status: SolanaWalletStatus) => void) {
  const modal = initReownAppKit();
  await modal.ready();

  const emit = () => {
    const status = readSolanaWalletStatus(modal);
    onChange(status);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("solana-wallet-status-change", {
          detail: status,
        }),
      );
    }
  };

  const emitSoon = () => {
    window.setTimeout(emit, 0);
    window.setTimeout(emit, 150);
    window.setTimeout(emit, 500);
  };

  emit();

  const unsubs: Array<() => void> = [];

  const maybeSubscribe = (fn: unknown, subscribe: () => unknown) => {
    if (typeof fn !== "function") return;

    try {
      const unsub = subscribe();

      if (typeof unsub === "function") {
        unsubs.push(unsub as () => void);
      }
    } catch {
      // Optional AppKit APIs differ by version.
    }
  };

  const anyModal = modal as unknown as Record<string, unknown>;

  const modalWithSubscriptions = modal as unknown as {
    subscribeAccount?: (onChange: () => void, namespace?: string) => (() => void) | void;
    subscribeWalletInfo?: (onChange: () => void) => (() => void) | void;
    subscribeProviders?: (onChange: () => void) => (() => void) | void;
  };

  maybeSubscribe(anyModal.subscribeAccount, () =>
    modalWithSubscriptions.subscribeAccount?.(() => emit(), SOLANA_NAMESPACE),
  );

  maybeSubscribe(anyModal.subscribeWalletInfo, () =>
    modalWithSubscriptions.subscribeWalletInfo?.(() => emit()),
  );

  maybeSubscribe(anyModal.subscribeProviders, () =>
    modalWithSubscriptions.subscribeProviders?.(() => emit()),
  );

  const injectedProvider = getInjectedSolanaProvider();

  if (injectedProvider?.on) {
    const handleAccountChanged = (publicKey?: unknown) => {
      if (isManualDisconnectFlagged()) {
        cacheAddress(null);
        const status: SolanaWalletStatus = { isConnected: false };
        onChange(status);
        window.dispatchEvent(
          new CustomEvent("solana-wallet-status-change", {
            detail: status,
          }),
        );
        emitSoon();
        return;
      }

      const nextAddress =
        normalizeInjectedPublicKey(publicKey) || readInjectedSolanaAddress();

      if (nextAddress) {
        cacheAddress(nextAddress);
        const status: SolanaWalletStatus = {
          isConnected: true,
          address: nextAddress,
          shortAddress: shortAddress(nextAddress),
        };

        onChange(status);
        window.dispatchEvent(
          new CustomEvent("solana-wallet-status-change", {
            detail: status,
          }),
        );
      } else {
        cacheAddress(null);

        const status: SolanaWalletStatus = {
          isConnected: false,
        };

        onChange(status);
        window.dispatchEvent(
          new CustomEvent("solana-wallet-status-change", {
            detail: status,
          }),
        );
      }

      emitSoon();
    };

    const handleConnect = (publicKey?: unknown) => {
      if (isManualDisconnectFlagged()) {
        cacheAddress(null);
        const status: SolanaWalletStatus = { isConnected: false };
        onChange(status);
        window.dispatchEvent(
          new CustomEvent("solana-wallet-status-change", {
            detail: status,
          }),
        );
        emitSoon();
        return;
      }

      const nextAddress =
        normalizeInjectedPublicKey(publicKey) || readInjectedSolanaAddress();

      if (nextAddress) {
        cacheAddress(nextAddress);

        const status: SolanaWalletStatus = {
          isConnected: true,
          address: nextAddress,
          shortAddress: shortAddress(nextAddress),
        };

        onChange(status);
        window.dispatchEvent(
          new CustomEvent("solana-wallet-status-change", {
            detail: status,
          }),
        );
      }

      emitSoon();
    };

    const handleDisconnect = () => {
      cacheAddress(null);

      const status: SolanaWalletStatus = {
        isConnected: false,
      };

      onChange(status);
      window.dispatchEvent(
        new CustomEvent("solana-wallet-status-change", {
          detail: status,
        }),
      );

      emitSoon();
    };

    injectedProvider.on("accountChanged", handleAccountChanged);
    injectedProvider.on("connect", handleConnect);
    injectedProvider.on("disconnect", handleDisconnect);

    unsubs.push(() => {
      const off = injectedProvider.off ?? injectedProvider.removeListener;

      if (typeof off === "function") {
        off.call(injectedProvider, "accountChanged", handleAccountChanged);
        off.call(injectedProvider, "connect", handleConnect);
        off.call(injectedProvider, "disconnect", handleDisconnect);
      }
    });
  }

  const handleFocusOrVisibility = () => {
    emitSoon();
  };

  window.addEventListener("focus", handleFocusOrVisibility);
  document.addEventListener("visibilitychange", handleFocusOrVisibility);

  unsubs.push(() => {
    window.removeEventListener("focus", handleFocusOrVisibility);
    document.removeEventListener("visibilitychange", handleFocusOrVisibility);
  });

  return () => {
    for (const unsub of unsubs) {
      try {
        unsub();
      } catch {
        // ignore unsubscribe errors
      }
    }
  };
}
