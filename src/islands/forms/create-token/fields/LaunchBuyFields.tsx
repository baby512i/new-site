import type { UseFormReturn } from "react-hook-form";
import { FormField } from "../../components/FormField";
import { TextInput } from "../../components/TextInput";
import {
  getFieldErrorMessage,
  isFieldInvalid,
} from "../utils/form-errors";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";

/**
 * Both Pump.fun and Raydium LaunchLab share the optional `initialBuy` field.
 * Rather than accept a union of `UseFormReturn<PumpFunValues> |
 * UseFormReturn<RaydiumLaunchlabValues>` (which makes RHF's `register` not
 * callable because the two function signatures don't overlap), we type the
 * prop with a structurally-minimal shape that both branches satisfy.
 */
export interface LaunchBuyFormShape {
  initialBuy?: string;
}

interface LaunchBuyFieldsProps {
  form: UseFormReturn<LaunchBuyFormShape>;
}

/**
 * Optional initial-buy SOL input. The schema validates the SOL amount when
 * present and treats an empty string as "no initial buy".
 */
export function LaunchBuyFields({ form }: LaunchBuyFieldsProps) {
  const {
    register,
    formState: { errors },
  } = form;

  const wideErrors =
    errors as unknown as import("react-hook-form").FieldErrors<CreateTokenValues>;

  return (
    <FormField
      htmlFor="initialBuy"
      label="Initial buy (SOL)"
      optional
      error={getFieldErrorMessage(wideErrors, "initialBuy")}
      hint="Optional. SOL amount you want to buy at launch from the curve. Start small."
    >
      <TextInput
        id="initialBuy"
        type="text"
        inputMode="decimal"
        placeholder="0.5"
        suffix="SOL"
        invalid={isFieldInvalid(wideErrors, "initialBuy")}
        {...register("initialBuy")}
      />
    </FormField>
  );
}
