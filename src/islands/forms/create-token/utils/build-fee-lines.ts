import type { CreateTokenPlatform } from "../../../../lib/tool-config/create-token-platforms";
import { CREATE_TOKEN_FEES } from "../../../../lib/tool-config/create-token-fees";
import type { FeeLine } from "../../components/FeeSummary";
import type { CreateTokenReviewSnapshot } from "./build-review-items";

export interface BuildFeeLinesResult {
  lines: FeeLine[];
  totalSol: string;
}

function formatSol(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return `${value} SOL`;
}

function isChargeableFee(value: string): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function sumSol(values: string[]): string {
  const total = values.reduce((acc, value) => {
    const n = Number(value);
    return Number.isFinite(n) ? acc + n : acc;
  }, 0);
  if (total <= 0) return "—";
  return `~${total.toFixed(5).replace(/\.?0+$/, "")} SOL`;
}

/**
 * Fee summary from static platform config + enabled optional features.
 * Values are estimates until dxra-core-api returns live numbers.
 */
export function buildFeeLines(
  platformId: CreateTokenPlatform,
  values: CreateTokenReviewSnapshot,
): BuildFeeLinesResult {
  const config = CREATE_TOKEN_FEES[platformId];
  const chargeable: string[] = [config.serviceFeeSol, config.estimatedNetworkFeeSol];

  const lines: FeeLine[] = [
    {
      label: "Service fee",
      value: formatSol(config.serviceFeeSol),
      description: "Platform fee charged at token creation.",
    },
    {
      label: "Estimated network fee",
      value: formatSol(config.estimatedNetworkFeeSol),
      description: "Solana transaction fee (approximate).",
    },
  ];

  if (values.includeCreatorInfo) {
    const creatorFee = config.optionalFees.creatorInfoSol ?? "0";
    if (isChargeableFee(creatorFee)) {
      chargeable.push(creatorFee);
      lines.push({
        label: "Creator info",
        value: formatSol(creatorFee),
      });
    }
  }

  if (values.includeVanityAddress) {
    const vanityFee = config.optionalFees.vanityAddressSol ?? "0";
    if (isChargeableFee(vanityFee)) {
      chargeable.push(vanityFee);
      lines.push({
        label: "Vanity address",
        value: formatSol(vanityFee),
      });
    }
  }

  return {
    lines,
    totalSol: sumSol(chargeable),
  };
}
