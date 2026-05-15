import type { CreateTokenPlatform } from "./create-token-platforms";

export type CreateTokenFeeConfig = {
  serviceFeeSol: string;
  estimatedNetworkFeeSol: string;
  authorityRevokesFree: boolean;
  optionalFees: {
    creatorInfoSol?: string;
    vanityAddressSol?: string;
  };
};

export const CREATE_TOKEN_FEES: Record<CreateTokenPlatform, CreateTokenFeeConfig> =
  {
    spl: {
      serviceFeeSol: "0.05",
      estimatedNetworkFeeSol: "0.00001",
      authorityRevokesFree: true,
      optionalFees: {
        creatorInfoSol: "0",
        vanityAddressSol: "0",
      },
    },
    taxToken: {
      serviceFeeSol: "0.08",
      estimatedNetworkFeeSol: "0.00002",
      authorityRevokesFree: true,
      optionalFees: {
        creatorInfoSol: "0",
        vanityAddressSol: "0",
      },
    },
    pumpfun: {
      serviceFeeSol: "0.05",
      estimatedNetworkFeeSol: "0.00002",
      authorityRevokesFree: true,
      optionalFees: {
        creatorInfoSol: "0",
        vanityAddressSol: "0",
      },
    },
    raydiumLaunchlab: {
      serviceFeeSol: "0.05",
      estimatedNetworkFeeSol: "0.00003",
      authorityRevokesFree: true,
      optionalFees: {
        creatorInfoSol: "0",
        vanityAddressSol: "0",
      },
    },
    meteoraDbc: {
      serviceFeeSol: "0.05",
      estimatedNetworkFeeSol: "0.00003",
      authorityRevokesFree: true,
      optionalFees: {
        creatorInfoSol: "0",
        vanityAddressSol: "0",
      },
    },
  } as const;
