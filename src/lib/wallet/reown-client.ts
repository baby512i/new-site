import { createAppKit } from "@reown/appkit/react";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { solana, solanaDevnet } from "@reown/appkit/networks";

type AppKitInstance = ReturnType<typeof createAppKit>;

let appKit: AppKitInstance | null = null;

const SOLANA_NAMESPACE = "solana" as const;
const SOLANA_WALLET_CACHE_KEY = "solana-wallet-address";

/** Explicit tuple keeps AppKit network typing happy. */
const networks = [solana, solanaDevnet] as [typeof solana, typeof solanaDevnet];

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function hasSolanaSession(modal: AppKitInstance) {
  const account = modal.getAccount(SOLANA_NAMESPACE);
  const address = modal.getAddressByChainNamespace(SOLANA_NAMESPACE);

  return account?.isConnected === true && Boolean(address);
}

function getSolanaAddress(modal: AppKitInstance) {
  return modal.getAddressByChainNamespace(SOLANA_NAMESPACE);
}

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function cacheAddress(address: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!address) {
    window.localStorage.removeItem(SOLANA_WALLET_CACHE_KEY);
    return;
  }

  window.localStorage.setItem(SOLANA_WALLET_CACHE_KEY, address);
}

/**
 * After reload, AppKit may still be reconnecting. Wait until that settles so we
 * don't open `Account` while disconnected (that shows the wrong / mini UI).
 */
async function settleSolanaReconnect(modal: AppKitInstance, maxMs = 3000) {
  const deadline = Date.now() + maxMs;

  while (Date.now() < deadline) {
    if (hasSolanaSession(modal)) {
      return;
    }

    const account = modal.getAccount(SOLANA_NAMESPACE);
    const status = account?.status;

    if (status === "reconnecting" || status === "connecting") {
      await delay(50);
      continue;
    }

    return;
  }
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

export function initReownAppKit() {
  if (appKit) {
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
    features: {
      analytics: false,
      swaps: false,
      onramp: false,
      email: false,
      socials: [],
      connectMethodsOrder: ["wallet"],
    },
    // themeVariables: {
    //   "--apkt-accent": "#38bdf8",
    //   "--apkt-color-mix": "#38bdf8",
    //   "--apkt-color-mix-strength": 20,
    //   "--apkt-border-radius-master": "12px",
    //   "--apkt-z-index": 9999,
    // },
  });

  return appKit;
}

export async function openSolanaConnectModal() {
  const modal = initReownAppKit();

  await modal.open({
    view: "Connect",
    namespace: "solana",
  });
}

export async function openSolanaWalletModal() {
  const modal = initReownAppKit();

  await modal.ready();
  await settleSolanaReconnect(modal);

  if (hasSolanaSession(modal)) {
    await modal.open({ view: "Account" });
    cacheAddress(getSolanaAddress(modal) || null);
    return;
  }

  await modal.open({
    view: "Connect",
    namespace: SOLANA_NAMESPACE,
  });

  cacheAddress(hasSolanaSession(modal) ? getSolanaAddress(modal) || null : null);
}

export async function getSolanaWalletStatus() {
  const modal = initReownAppKit();

  await modal.ready();
  await settleSolanaReconnect(modal);

  const connected = hasSolanaSession(modal);
  const address = connected ? getSolanaAddress(modal) : undefined;

  cacheAddress(address || null);

  return {
    isConnected: connected,
    address,
    shortAddress: address ? shortAddress(address) : undefined,
  };
}

type SolanaWalletStatus = {
  isConnected: boolean;
  address?: string;
  shortAddress?: string;
};

export async function subscribeSolanaWalletStatus(onChange: (status: SolanaWalletStatus) => void) {
  const modal = initReownAppKit();

  const emitStatus = () => {
    const connected = hasSolanaSession(modal);
    const address = connected ? getSolanaAddress(modal) : undefined;

    cacheAddress(address || null);

    onChange({
      isConnected: connected,
      address,
      shortAddress: address ? shortAddress(address) : undefined,
    });
  };

  await modal.ready();
  emitStatus();

  return modal.subscribeAccount(() => {
    emitStatus();
  }, SOLANA_NAMESPACE);
}

export function getCachedSolanaWalletAddress() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(SOLANA_WALLET_CACHE_KEY);
}

export async function openSolanaAccountModal() {
  const modal = initReownAppKit();

  await modal.open({
    view: "Account",
  });
}

export async function openSolanaNetworkModal() {
  const modal = initReownAppKit();

  await modal.open({
    view: "Networks",
  });
}
