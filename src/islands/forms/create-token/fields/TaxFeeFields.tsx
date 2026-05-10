import { useWatch, type UseFormReturn } from "react-hook-form";
import { FormField } from "../../components/FormField";
import { TextInput } from "../../components/TextInput";
import {
  AuthorityChoiceField,
  type AuthorityChoiceValue,
} from "./AuthorityChoiceField";
import type { TaxTokenValues } from "../../../../lib/validation/create-token/tax-token.schema";
import {
  getFieldErrorMessage,
  getNestedFieldErrorMessage,
  isFieldInvalid,
} from "../utils/form-errors";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";

interface TaxFeeFieldsProps {
  /**
   * The orchestrator passes the underlying `useForm<CreateTokenValues>` form,
   * narrowed to the Tax Token branch at the call site so RHF's `name` typing
   * narrows correctly inside this section.
   */
  form: UseFormReturn<TaxTokenValues>;
}

/**
 * Tax-token-specific (Token-2022 transfer fee) fields:
 * - Transfer fee in basis points
 * - Maximum per-transfer fee
 * - Transfer-fee authority
 * - Withdraw-withheld authority
 */
export function TaxFeeFields({ form }: TaxFeeFieldsProps) {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = form;

  const transferFeeAuthority =
    (useWatch({ control, name: "transferFeeAuthority" }) as
      | AuthorityChoiceValue
      | undefined) ?? { kind: "self" };

  const withdrawWithheldAuthority =
    (useWatch({ control, name: "withdrawWithheldAuthority" }) as
      | AuthorityChoiceValue
      | undefined) ?? { kind: "self" };

  // Re-cast to the wider RHF errors shape so the helpers (which key by
  // string) can be reused without leaking the discriminated union here.
  const wideErrors =
    errors as unknown as import("react-hook-form").FieldErrors<CreateTokenValues>;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          htmlFor="transferFeeBps"
          label="Transfer fee"
          required
          error={getFieldErrorMessage(wideErrors, "transferFeeBps")}
          hint="Basis points. 1 bp = 0.01%. Max 10000 (= 100%)."
        >
          <TextInput
            id="transferFeeBps"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            placeholder="100"
            suffix="bps"
            invalid={isFieldInvalid(wideErrors, "transferFeeBps")}
            {...register("transferFeeBps")}
          />
        </FormField>

        <FormField
          htmlFor="maxTransferFee"
          label="Max fee per transfer"
          required
          error={getFieldErrorMessage(wideErrors, "maxTransferFee")}
          hint="Hard cap on fee per single transfer, in raw token units (no decimals)."
        >
          <TextInput
            id="maxTransferFee"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            placeholder="1000000"
            invalid={isFieldInvalid(wideErrors, "maxTransferFee")}
            {...register("maxTransferFee")}
          />
        </FormField>
      </div>

      <AuthorityChoiceField
        namePrefix="tfa"
        label="Transfer-fee authority"
        description="Can update the transfer fee on this token."
        value={transferFeeAuthority}
        onChange={(next) =>
          setValue("transferFeeAuthority", next, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        addressError={
          getNestedFieldErrorMessage(
            wideErrors,
            "transferFeeAuthority.address",
          ) ?? getFieldErrorMessage(wideErrors, "transferFeeAuthority")
        }
      />

      <AuthorityChoiceField
        namePrefix="wwa"
        label="Withdraw-withheld authority"
        description="Can withdraw withheld fees from accounts that received transfers."
        value={withdrawWithheldAuthority}
        onChange={(next) =>
          setValue("withdrawWithheldAuthority", next, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        addressError={
          getNestedFieldErrorMessage(
            wideErrors,
            "withdrawWithheldAuthority.address",
          ) ?? getFieldErrorMessage(wideErrors, "withdrawWithheldAuthority")
        }
      />
    </div>
  );
}
