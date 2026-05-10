import type { UseFormReturn } from "react-hook-form";
import { FormSection } from "../../components/FormSection";
import { TaxFeeFields } from "../fields/TaxFeeFields";
import { BondingCurveFields } from "../fields/BondingCurveFields";
import {
  LaunchBuyFields,
  type LaunchBuyFormShape,
} from "../fields/LaunchBuyFields";
import type { CreateTokenPlatformConfig } from "../../../../lib/tool-config/create-token-platforms";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";
import type { TaxTokenValues } from "../../../../lib/validation/create-token/tax-token.schema";
import type { MeteoraDbcValues } from "../../../../lib/validation/create-token/meteora-dbc.schema";
import type { PlatformFieldVisibility } from "../utils/get-platform-field-visibility";

interface PlatformOptionsSectionProps {
  id: string;
  platform: CreateTokenPlatformConfig;
  visibility: PlatformFieldVisibility;
  form: UseFormReturn<CreateTokenValues>;
}

/**
 * Wrapper that delegates to platform-specific field groups. Returns null when
 * no platform-specific options apply (e.g. plain SPL).
 *
 * Each platform-specific field group receives the form narrowed to the matching
 * branch of the discriminated union — done via cast at this single boundary,
 * which keeps RHF's `name` typing tight inside each group.
 */
export function PlatformOptionsSection({
  id,
  platform,
  visibility,
  form,
}: PlatformOptionsSectionProps) {
  const visible =
    visibility.showTaxFields ||
    visibility.showBondingCurve ||
    visibility.showLaunchBuy;

  if (!visible) return null;

  return (
    <FormSection
      id={id}
      title="Platform options"
      description={`Settings specific to ${platform.label}.`}
    >
      {visibility.showTaxFields ? (
        <TaxFeeFields
          form={form as unknown as UseFormReturn<TaxTokenValues>}
        />
      ) : null}

      {visibility.showBondingCurve ? (
        <BondingCurveFields
          form={form as unknown as UseFormReturn<MeteoraDbcValues>}
        />
      ) : null}

      {visibility.showLaunchBuy ? (
        <LaunchBuyFields
          form={form as unknown as UseFormReturn<LaunchBuyFormShape>}
        />
      ) : null}
    </FormSection>
  );
}
