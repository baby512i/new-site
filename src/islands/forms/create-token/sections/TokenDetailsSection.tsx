import type { UseFormReturn } from "react-hook-form";
import { FormSection } from "../../components/FormSection";
import { FormField } from "../../components/FormField";
import { TextInput } from "../../components/TextInput";
import type { CreateTokenPlatformConfig } from "../../../../lib/tool-config/create-token-platforms";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";
import type { PlatformFieldVisibility } from "../utils/get-platform-field-visibility";
import {
  getFieldErrorMessage,
  isFieldInvalid,
} from "../utils/form-errors";

interface TokenDetailsSectionProps {
  id: string;
  platform: CreateTokenPlatformConfig;
  visibility: PlatformFieldVisibility;
  form: UseFormReturn<CreateTokenValues>;
}

/**
 * Token name, symbol, decimals, and initial supply.
 *
 * Decimals + initial supply are platform-conditional. When the platform sets
 * them automatically (Pump.fun), we render a clearly disabled placeholder with
 * a reason instead of hiding the row entirely so users always see the same
 * shape across pages.
 */
export function TokenDetailsSection({
  id,
  platform,
  visibility,
  form,
}: TokenDetailsSectionProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <FormSection
      id={id}
      title="Token details"
      description="Public name and symbol shown in wallets and explorers."
    >
      <FormField
        htmlFor="tokenName"
        label="Token name"
        required
        error={getFieldErrorMessage(errors, "tokenName")}
        hint="3 to 32 characters. Visible in wallets and explorers."
      >
        <TextInput
          id="tokenName"
          placeholder="e.g. Solana Tools Token"
          maxLength={32}
          invalid={isFieldInvalid(errors, "tokenName")}
          {...register("tokenName")}
        />
      </FormField>

      <FormField
        htmlFor="symbol"
        label={platform.id === "pumpfun" ? "Ticker" : "Symbol"}
        required
        error={getFieldErrorMessage(errors, "symbol")}
        hint="Letters and numbers only. Up to 10 characters."
      >
        <TextInput
          id="symbol"
          placeholder="e.g. STT"
          maxLength={10}
          invalid={isFieldInvalid(errors, "symbol")}
          {...register("symbol")}
        />
      </FormField>

      {visibility.showDecimals ? (
        <FormField
          htmlFor="decimals"
          label="Decimals"
          required
          error={getFieldErrorMessage(errors, "decimals")}
          hint="Most fungible tokens use 6 or 9. Cannot be changed later."
        >
          <TextInput
            id="decimals"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            placeholder="9"
            invalid={isFieldInvalid(errors, "decimals")}
            {...register("decimals" as never)}
          />
        </FormField>
      ) : (
        <FormField
          htmlFor="decimals-disabled"
          label="Decimals"
          disabledReason={`${platform.shortLabel} sets decimals automatically.`}
        >
          <TextInput
            id="decimals-disabled"
            value="—"
            disabled
            readOnly
          />
        </FormField>
      )}

      {visibility.showInitialSupply ? (
        <FormField
          htmlFor="initialSupply"
          label="Initial supply"
          required
          error={getFieldErrorMessage(errors, "initialSupply")}
          hint="Whole number, no separators. Stored as a string to keep precision."
        >
          <TextInput
            id="initialSupply"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            placeholder="1000000000"
            invalid={isFieldInvalid(errors, "initialSupply")}
            {...register("initialSupply" as never)}
          />
        </FormField>
      ) : (
        <FormField
          htmlFor="initialSupply-disabled"
          label="Initial supply"
          disabledReason={`${platform.shortLabel} sets the initial supply automatically.`}
        >
          <TextInput
            id="initialSupply-disabled"
            value="Platform default"
            disabled
            readOnly
          />
        </FormField>
      )}
    </FormSection>
  );
}
