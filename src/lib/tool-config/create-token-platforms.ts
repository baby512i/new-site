/**
 * Static configuration for every Create Solana Token platform variant.
 *
 * Why this lives in `src/lib`:
 * - Astro static pages import this at build time to render unique SEO content.
 * - The React form island also imports the same config so platform metadata
 *   (label, supports flags) stays consistent without duplicating strings.
 *
 * IMPORTANT: keep this file SDK-free. No `@solana/*`, `@reown/*`, or wallet
 * imports may live here, otherwise every page would pull those bundles into
 * the initial public layout.
 */

/**
 * Note: there is no standalone `token2022` platform.
 * The `taxToken` page is the canonical Token-2022 entry point on this site
 * because every Token-2022 use case we currently support enables the
 * transfer fee extension. Add a new platform id here only if a non-fee
 * Token-2022 workflow gets a dedicated page later.
 */
export type CreateTokenPlatform =
  | "spl"
  | "pumpfun"
  | "raydiumLaunchlab"
  | "meteoraDbc"
  | "taxToken";

export type CreateTokenPlatformBadgeTone =
  | "neutral"
  | "brand"
  | "pro"
  | "warning";

export interface CreateTokenPlatformBadge {
  label: string;
  tone: CreateTokenPlatformBadgeTone;
}

/**
 * Capability flags read by the form to decide which sections/fields to render.
 * Keep flags small and explicit — do not encode platform-specific behaviour
 * inline inside the form, branch on these flags instead.
 */
export interface CreateTokenPlatformSupports {
  decimals: boolean;
  initialSupply: boolean;
  metadata: boolean;
  socialLinks: boolean;
  imageUpload: boolean;
  revokeMintAuthority: boolean;
  revokeFreezeAuthority: boolean;
  makeImmutable: boolean;
  transferFee: boolean;
  token2022Extensions: boolean;
  initialBuy: boolean;
  bondingCurvePreset: boolean;
}

export interface CreateTokenFaqItem {
  q: string;
  a: string;
}

export interface CreateTokenRelatedTool {
  href: string;
  label: string;
  description: string;
}

export interface CreateTokenPlatformConfig {
  id: CreateTokenPlatform;
  label: string;
  shortLabel: string;
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  badge: CreateTokenPlatformBadge;
  supports: CreateTokenPlatformSupports;
  risks: string[];
  requirements: string[];
  faq: CreateTokenFaqItem[];
  relatedTools: CreateTokenRelatedTool[];
  /** Short label rendered above hero/breadcrumb. */
  category: string;
  /** Estimated platform fee summary line shown in the right panel. */
  feeSummary: string;
}

const sharedRelatedTools: CreateTokenRelatedTool[] = [
  {
    href: "/revoke-mint-authority",
    label: "Revoke Mint Authority",
    description: "Disable future minting after launch to harden token trust.",
  },
  {
    href: "/revoke-freeze-authority",
    label: "Revoke Freeze Authority",
    description: "Prevent the freeze authority from blocking transfers later.",
  },
  {
    href: "/update-token-metadata",
    label: "Update Token Metadata",
    description: "Edit the on-chain name, symbol, and image after creation.",
  },
];

const baseSupports: CreateTokenPlatformSupports = {
  decimals: true,
  initialSupply: true,
  metadata: true,
  socialLinks: true,
  imageUpload: true,
  revokeMintAuthority: false,
  revokeFreezeAuthority: false,
  makeImmutable: false,
  transferFee: false,
  token2022Extensions: false,
  initialBuy: false,
  bondingCurvePreset: false,
};

export const CREATE_TOKEN_PLATFORMS: Record<
  CreateTokenPlatform,
  CreateTokenPlatformConfig
> = {
  spl: {
    id: "spl",
    label: "SPL Token (classic)",
    shortLabel: "SPL",
    url: "/create-spl-token",
    title: "Create SPL Token on Solana | Solana Tools",
    metaDescription:
      "Launch a classic Solana SPL token with name, symbol, supply, decimals, on-chain metadata, and optional authority revocation. Non-custodial, wallet-signed.",
    h1: "Create an SPL Token on Solana",
    intro:
      "Launch a standard SPL token using the original Solana Token Program. SPL is the most compatible token standard across wallets, explorers, market makers, and DeFi protocols on Solana.",
    badge: { label: "Most compatible", tone: "brand" },
    category: "Token creation",
    feeSummary: "Network rent + small platform fee. Final cost shown before signing.",
    supports: {
      ...baseSupports,
      revokeMintAuthority: true,
      revokeFreezeAuthority: true,
      makeImmutable: true,
    },
    requirements: [
      "A connected non-custodial Solana wallet (Phantom, Solflare, Backpack, etc.).",
      "Enough SOL in the wallet to cover rent and the platform fee.",
      "Token name, symbol, decimals, and initial supply prepared.",
      "Optional: token image, description, and project links.",
    ],
    risks: [
      "Revoking mint authority is permanent — you cannot mint more supply later.",
      "Revoking freeze authority is permanent — you cannot freeze accounts later.",
      "Marking metadata immutable prevents fixing typos or branding mistakes.",
      "Anyone can create a token with any name. Always verify the mint address.",
    ],
    faq: [
      {
        q: "What is an SPL token?",
        a: "SPL tokens are fungible tokens issued by the original Solana Token Program. They are the standard for DeFi, market making, and the broadest wallet support on Solana.",
      },
      {
        q: "How many decimals should I use?",
        a: "Most fungible tokens use 6 or 9 decimals. Lower decimals can be useful for utility tokens; 9 matches SOL-like precision. Pick the value before you launch — it cannot be changed afterwards.",
      },
      {
        q: "Can I mint more supply later?",
        a: "Only if you keep the mint authority. Revoking the mint authority is one-way and permanent.",
      },
      {
        q: "Why does my wallet need SOL to create the token?",
        a: "Solana charges rent to create the mint account, the metadata account, and the initial holder account. The amount is small but required.",
      },
    ],
    relatedTools: sharedRelatedTools,
  },

  pumpfun: {
    id: "pumpfun",
    label: "Pump.fun token",
    shortLabel: "Pump.fun",
    url: "/create-pump-fun-token",
    title: "Create a Pump.fun Token | Solana Tools",
    metaDescription:
      "Launch a token on Pump.fun with name, ticker, image, and project links. Non-custodial creation flow, wallet-signed. Optional initial buy.",
    h1: "Create a Token on Pump.fun",
    intro:
      "Pump.fun launches tokens on a fair-launch bonding curve. There is no manual decimals or initial supply choice — the curve is fixed by the platform. You just provide the token name, ticker, image, and project links.",
    badge: { label: "Bonding curve", tone: "warning" },
    category: "Launchpad",
    feeSummary: "Pump.fun creation fee (denominated in SOL) + small platform fee.",
    supports: {
      ...baseSupports,
      decimals: false,
      initialSupply: false,
      revokeMintAuthority: false,
      revokeFreezeAuthority: false,
      makeImmutable: false,
      initialBuy: true,
    },
    requirements: [
      "Connected non-custodial Solana wallet (Pump.fun typically expects mainnet).",
      "Enough SOL for the Pump.fun creation fee, rent, and any optional initial buy.",
      "Token name, ticker, description, and image ready before launch.",
      "Project links (website, X/Twitter, Telegram) if you want them on the token page.",
    ],
    risks: [
      "Pump.fun launches are highly volatile. Many tokens lose most of their value quickly.",
      "Initial buys execute against the bonding curve and price impact is real — start small.",
      "The token name, ticker, and image are part of the on-chain identity and cannot be edited freely later.",
      "Anyone can clone metadata. Always link to the verified mint address.",
    ],
    faq: [
      {
        q: "Why can I not choose decimals or supply?",
        a: "Pump.fun uses a fixed bonding curve and a standardised supply. The platform handles supply and decimals so traders can compare tokens consistently.",
      },
      {
        q: "Do I receive any tokens at launch?",
        a: "Only if you set an optional initial buy. Without it, you launch the token but hold zero tokens until you trade on the curve.",
      },
      {
        q: "When does the token migrate off the bonding curve?",
        a: "Pump.fun migrates to a downstream AMM after a market cap threshold. The threshold and migration target can change — read Pump.fun docs for the latest behaviour.",
      },
    ],
    relatedTools: [
      {
        href: "/pump-bundler",
        label: "Pump Bundler",
        description: "Bundle multi-wallet buys at launch for distribution control.",
      },
      {
        href: "/pump-volume-bot",
        label: "Pump Volume Bot",
        description: "Generate volume on a Pump.fun token after launch.",
      },
    ],
  },

  raydiumLaunchlab: {
    id: "raydiumLaunchlab",
    label: "Raydium LaunchLab token",
    shortLabel: "LaunchLab",
    url: "/create-raydium-launchlab-token",
    title: "Create a Raydium LaunchLab Token | Solana Tools",
    metaDescription:
      "Launch a token on Raydium LaunchLab with metadata, project links, and optional launch settings. Non-custodial flow. Wallet signs only on the final action.",
    h1: "Create a Token on Raydium LaunchLab",
    intro:
      "Raydium LaunchLab is Raydium's launchpad for fair token launches that migrate into Raydium liquidity. Provide metadata and the launch parameters supported by LaunchLab — this tool prepares the unsigned transaction for your wallet to sign.",
    badge: { label: "Raydium native", tone: "brand" },
    category: "Launchpad",
    feeSummary: "Raydium LaunchLab creation fee + Solana rent + platform fee.",
    supports: {
      ...baseSupports,
      decimals: false,
      initialSupply: false,
      initialBuy: true,
    },
    requirements: [
      "Connected non-custodial Solana wallet on the network LaunchLab expects.",
      "Enough SOL for rent and the LaunchLab creation fee.",
      "Token name, ticker, description, and image.",
      "Optional initial buy amount in SOL if LaunchLab supports a launch buy.",
    ],
    risks: [
      "Launchpad tokens are speculative and can lose value rapidly.",
      "LaunchLab parameters are platform-defined and may change over time.",
      "Initial buys move price against the launch curve. Start with a small test amount.",
      "Verify the mint address before sharing it. Lookalike tokens are common.",
    ],
    faq: [
      {
        q: "What is Raydium LaunchLab?",
        a: "LaunchLab is Raydium's launch product for new tokens. It typically uses a curve and migrates liquidity into a Raydium pool when conditions are met.",
      },
      {
        q: "Can I set my own decimals?",
        a: "LaunchLab uses platform-defined token parameters so traders can compare launches consistently. You provide metadata and optional launch settings, not raw mint parameters.",
      },
      {
        q: "Is LaunchLab safer than direct AMM launches?",
        a: "Different tradeoffs. LaunchLab is structured but still high-risk. Always understand the token, the team, and the curve before participating.",
      },
    ],
    relatedTools: [
      {
        href: "/launchlab-bundler",
        label: "LaunchLab Bundler",
        description: "Coordinate multi-wallet buys at launch for LaunchLab tokens.",
      },
      {
        href: "/launchlab-volume-bot",
        label: "LaunchLab Volume Bot",
        description: "Manage volume strategies on LaunchLab tokens after launch.",
      },
    ],
  },

  meteoraDbc: {
    id: "meteoraDbc",
    label: "Meteora DBC token",
    shortLabel: "Meteora DBC",
    url: "/create-meteora-dbc-token",
    title: "Create a Meteora DBC Token | Solana Tools",
    metaDescription:
      "Launch a token on Meteora's Dynamic Bonding Curve (DBC). Provide metadata and a curve preset; this tool prepares an unsigned transaction for your wallet.",
    h1: "Create a Token with Meteora Dynamic Bonding Curve",
    intro:
      "Meteora DBC (Dynamic Bonding Curve) launches tokens with a programmable price curve and clear migration rules. This page prepares the launch metadata and unsigned transaction. Picking a curve preset is the most important decision — it controls how price moves with demand.",
    badge: { label: "Dynamic curve", tone: "pro" },
    category: "Launchpad",
    feeSummary: "Meteora DBC creation fee + Solana rent + platform fee.",
    supports: {
      ...baseSupports,
      decimals: false,
      initialSupply: false,
      bondingCurvePreset: true,
    },
    requirements: [
      "Connected non-custodial Solana wallet.",
      "Enough SOL for rent and Meteora DBC fees.",
      "Token name, ticker, description, and image.",
      "Decide which curve preset matches your launch goal before signing.",
    ],
    risks: [
      "Bonding curve dynamics are non-linear. Small early buys can have outsized price impact.",
      "Choosing the wrong curve preset can lock in poor price discovery.",
      "Like all launches, DBC tokens are speculative and risky.",
      "Metadata/image is part of the on-chain identity — verify before signing.",
    ],
    faq: [
      {
        q: "What is a Dynamic Bonding Curve?",
        a: "A bonding curve sets price as a function of supply on the curve. Meteora DBC adds dynamic parameters and migration logic so the launch can transition into a long-term pool.",
      },
      {
        q: "How do I pick a curve preset?",
        a: "Pick a preset that matches your goal: gentler curves favor steady accumulation, steeper curves favor early discovery and faster migration. Read Meteora's docs for the exact tradeoffs.",
      },
      {
        q: "Can I change the curve later?",
        a: "Curve parameters are usually set at launch and cannot be tuned freely after. Always test a preset on devnet if Meteora supports it before launching on mainnet.",
      },
    ],
    relatedTools: [
      {
        href: "/meteora-bundler",
        label: "Meteora Bundler",
        description: "Bundle multi-wallet buys for Meteora-launched tokens.",
      },
      {
        href: "/meteora-volume-bot",
        label: "Meteora Volume Bot",
        description: "Manage volume strategies on Meteora tokens after launch.",
      },
    ],
  },

  /**
   * `taxToken` is also the canonical Token-2022 entry point on this site.
   * The page targets both "tax token" and "token-2022" keyword clusters
   * because every Token-2022 launch we currently support enables the
   * transfer fee extension.
   */
  taxToken: {
    id: "taxToken",
    label: "Tax Token (Token-2022 Transfer Fee)",
    shortLabel: "Tax Token",
    url: "/create-tax-token",
    title: "Create a Tax Token on Solana (Token-2022 Transfer Fee) | Solana Tools",
    metaDescription:
      "Create a Solana Token-2022 mint with a transfer fee (tax) on every transfer. Configure basis points, max fee, and authority controls. Non-custodial, wallet-signed.",
    h1: "Create a Tax Token on Solana (Token-2022 Transfer Fee)",
    intro:
      "Tax tokens are Solana Token-2022 mints with the transfer fee extension enabled. A configurable basis-point fee is taken on every transfer and accumulated in withheld balances. The transfer-fee authority can update settings; the withdraw-withheld authority can collect the accumulated fees.",
    badge: { label: "Token-2022 · Transfer fee", tone: "pro" },
    category: "Token creation",
    feeSummary: "Higher Solana rent (Token-2022 + transfer fee extension) + platform fee.",
    supports: {
      ...baseSupports,
      revokeMintAuthority: true,
      revokeFreezeAuthority: true,
      makeImmutable: true,
      transferFee: true,
      token2022Extensions: true,
    },
    requirements: [
      "Connected non-custodial Solana wallet.",
      "Decide on transfer fee basis points (1 bp = 0.01%) and a maximum per-transfer fee.",
      "Decide who controls the transfer-fee authority and withdraw-withheld authority.",
      "Verify your target wallets and DEXes support Token-2022 transfer-fee tokens.",
    ],
    risks: [
      "High transfer fees push traders away and can break aggregator routing.",
      "Some wallets do not display Token-2022 transfer-fee tokens correctly.",
      "If you keep the transfer-fee authority, holders trust you not to raise the fee.",
      "If you revoke authorities, the configuration is permanent. Choose deliberately.",
    ],
    faq: [
      {
        q: "Is a tax token the same as a Token-2022?",
        a: "A tax token is a Solana Token-2022 mint with the transfer fee extension turned on. Token-2022 is the upgraded SPL token program; the transfer fee is one of its optional extensions. This page is the Token-2022 entry point on this site.",
      },
      {
        q: "Should I use SPL or Token-2022?",
        a: "Use classic SPL for the broadest compatibility across wallets, explorers, and DEXes. Use Token-2022 (this page) when you specifically need the transfer fee extension.",
      },
      {
        q: "How are transfer fees collected?",
        a: "On every transfer, the protocol withholds the configured fee inside the destination account. The withdraw-withheld authority can later collect those withheld balances.",
      },
      {
        q: "What is a reasonable transfer fee?",
        a: "Most projects use 0.5% to 5% (50 to 500 bps). Very high fees discourage trading and can be filtered out by aggregators.",
      },
      {
        q: "Can I change the fee later?",
        a: "Only if you keep the transfer-fee authority. If you revoke that authority, the fee is permanent.",
      },
      {
        q: "Are Token-2022 transfer-fee tokens supported on all Solana DEXes?",
        a: "Support varies. Verify your liquidity venue, aggregator, and any wallet your audience uses before launching at scale.",
      },
    ],
    relatedTools: [
      {
        href: "/claim-tax-fee",
        label: "Claim Tax Fee",
        description: "Withdraw withheld tax balances to your treasury.",
      },
      {
        href: "/change-tax-setting",
        label: "Change Tax Setting",
        description: "Update transfer fee basis points and max fee.",
      },
      {
        href: "/revoke-tax-config-authority",
        label: "Revoke Tax Config Authority",
        description: "Permanently lock the transfer fee configuration.",
      },
    ],
  },
};

/** Default platform shown on the umbrella `/create-solana-token` page. */
export const DEFAULT_CREATE_TOKEN_PLATFORM: CreateTokenPlatform = "spl";

export const CREATE_TOKEN_PLATFORM_ORDER: CreateTokenPlatform[] = [
  "spl",
  "taxToken",
  "pumpfun",
  "raydiumLaunchlab",
  "meteoraDbc",
];

export function getCreateTokenPlatform(
  id: CreateTokenPlatform,
): CreateTokenPlatformConfig {
  return CREATE_TOKEN_PLATFORMS[id];
}

export function listCreateTokenPlatforms(): CreateTokenPlatformConfig[] {
  return CREATE_TOKEN_PLATFORM_ORDER.map((id) => CREATE_TOKEN_PLATFORMS[id]);
}
