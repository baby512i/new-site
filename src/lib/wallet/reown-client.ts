import { createAppKit } from "@reown/appkit";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { solana, solanaDevnet } from "@reown/appkit/networks";

type AppKitInstance = ReturnType<typeof createAppKit>;
type ThemeMode = "light" | "dark";

export const SOLANA_NAMESPACE = "solana" as const;
const SOLANA_WALLET_CACHE_KEY = "solana-wallet-address";

let appKit: AppKitInstance | null = null;

/** Explicit tuple keeps AppKit network typing happy. */
const networks = [solana, solanaDevnet] as [typeof solana, typeof solanaDevnet];

type SolanaWalletStatus = {
  isConnected: boolean;
  address?: string;
  shortAddress?: string;
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

function hasSolanaSession(modal: AppKitInstance) {
  const account = modal.getAccount(SOLANA_NAMESPACE);
  const address = getSolanaAddress(modal);
  return account?.isConnected === true && Boolean(address);
}

/**
 * Resolve the *active* current Solana address.
 * Do NOT prefer `allAccounts.find(...)` because array order can contain stale entries.
 */
export function getSolanaAddress(modal: AppKitInstance) {
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
  const value = import.meta.env.PUBLIC_DEFAULT_NETWORK;

  if (value === "devnet") {
    return solanaDevnet;
  }

  return solana;
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
  const modal = initReownAppKit();
  syncAppKitThemeMode(modal);
  await modal.ready();
  await modal.open({ view: "Connect", namespace: SOLANA_NAMESPACE });
}

export async function openSolanaAccountModal() {
  const modal = initReownAppKit();
  syncAppKitThemeMode(modal);
  await modal.ready();
  await modal.open({ view: "Account" });
}

export async function openSolanaNetworkModal() {
  const modal = initReownAppKit();
  syncAppKitThemeMode(modal);
  await modal.ready();
  await modal.open({ view: "Networks" });
}

export async function openSolanaWalletModal() {
  const modal = initReownAppKit();
  syncAppKitThemeMode(modal);

  await modal.ready();
  // Ensure we read the *current* active wallet before selecting the view.
  const status = await refreshSolanaWalletStatus(2500);

  if (status.isConnected) {
    await modal.open({ view: "Account" });
    return;
  }

  await modal.open({ view: "Connect", namespace: SOLANA_NAMESPACE });
}

export async function subscribeSolanaWalletStatus(onChange: (status: SolanaWalletStatus) => void) {
  const modal = initReownAppKit();
  await modal.ready();

  const emit = () => {
    onChange(readSolanaWalletStatus(modal));
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

  maybeSubscribe(anyModal.subscribeAccount, () =>
    (modal as any).subscribeAccount(() => emit(), SOLANA_NAMESPACE),
  );

  maybeSubscribe(anyModal.subscribeWalletInfo, () =>
    (modal as any).subscribeWalletInfo(() => emit()),
  );

  maybeSubscribe(anyModal.subscribeProviders, () =>
    (modal as any).subscribeProviders(() => emit()),
  );

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
