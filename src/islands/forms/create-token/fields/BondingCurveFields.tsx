import { useWatch, type UseFormReturn } from "react-hook-form";
import { FormField } from "../../components/FormField";
import { RadioCards } from "../../components/RadioCards";
import {
  METEORA_DBC_CURVE_PRESETS,
  type MeteoraDbcValues,
} from "../../../../lib/validation/create-token/meteora-dbc.schema";
import {
  getFieldErrorMessage,
} from "../utils/form-errors";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";

type CurvePreset = (typeof METEORA_DBC_CURVE_PRESETS)[number];

interface BondingCurveFieldsProps {
  form: UseFormReturn<MeteoraDbcValues>;
}

/**
 * Meteora DBC-only field: bonding curve preset chooser.
 *
 * Curve choice is final at launch — surfaced clearly in the field hint and in
 * downstream review/safety sections.
 */
export function BondingCurveFields({ form }: BondingCurveFieldsProps) {
  const { setValue, control, formState } = form;

  const curvePreset =
    (useWatch({ control, name: "curvePreset" }) as CurvePreset | undefined) ??
    "balanced";

  const wideErrors =
    formState.errors as unknown as import("react-hook-form").FieldErrors<CreateTokenValues>;

  return (
    <FormField
      htmlFor="curvePreset"
      label="Bonding curve preset"
      required
      error={getFieldErrorMessage(wideErrors, "curvePreset")}
      hint="Pick the curve that matches your launch goal. Cannot be changed after launch."
    >
      <RadioCards<CurvePreset>
        name="curvePreset"
        value={curvePreset}
        onChange={(next) =>
          setValue("curvePreset", next, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        options={[
          {
            value: "gentle",
            label: "Gentle",
            description: "Slower price discovery, friendlier early entry.",
          },
          {
            value: "balanced",
            label: "Balanced",
            description: "Default Meteora DBC curve. Reasonable for most launches.",
          },
          {
            value: "steep",
            label: "Steep",
            description: "Faster price discovery, larger early price impact.",
          },
        ]}
        columns={3}
      />
    </FormField>
  );
}
