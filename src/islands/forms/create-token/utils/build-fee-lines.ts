import type { CreateTokenPlatformConfig } from "../../../../lib/tool-config/create-token-platforms";
import type { FeeLine } from "../../components/FeeSummary";

/**
 * Static fee summary lines for the right-side panel.
 *
 * The numbers stay placeholders ("~") until dxra-core-api returns the real
 * estimate right before signing. This helper just decides which categories of
 * fees apply to the active platform.
 */
export function buildFeeLines(platform: CreateTokenPlatformConfig): FeeLine[] {
  const lines: FeeLine[] = [
    {
      label: "Solana network rent",
      value: "~",
      description: "Required for the mint and metadata accounts.",
    },
  ];

  const isFirstPartyMint = platform.id === "spl" || platform.id === "taxToken";

  if (!isFirstPartyMint) {
    lines.push({
      label: `${platform.shortLabel} fee`,
      value: "~",
      description: `Fee charged by ${platform.label} at launch.`,
    });
  }

  lines.push({
    label: "Platform fee",
    value: "~",
    description: "Small fee charged by Solana Tools at creation.",
  });

  return lines;
}
