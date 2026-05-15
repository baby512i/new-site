import { Controller, type UseFormReturn } from "react-hook-form";
import { FormField } from "../../components/FormField";
import { SwitchField } from "../../components/SwitchField";
import { TextInput } from "../../components/TextInput";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";
import {
  getFieldErrorMessage,
  isFieldInvalid,
} from "../utils/form-errors";
import { clearCreatorInfoFields } from "../utils/reset-conditional-fields";

interface CreatorInfoFieldsProps {
  form: UseFormReturn<CreateTokenValues>;
}

export function CreatorInfoFields({ form }: CreatorInfoFieldsProps) {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;

  const includeCreatorInfo = watch("includeCreatorInfo" as never);

  return (
    <div className="grid gap-4">
      <Controller
        name={"includeCreatorInfo" as never}
        control={control}
        render={({ field }) => (
          <SwitchField
            id="includeCreatorInfo"
            label="Include creator info"
            description="Add your project/team name and website to token metadata."
            badge={{ label: "Free", tone: "success" }}
            checked={Boolean(field.value)}
            onCheckedChange={(checked) => {
              field.onChange(checked);
              if (!checked) clearCreatorInfoFields(form);
            }}
            onBlur={field.onBlur}
            ref={field.ref}
          />
        )}
      />

      {includeCreatorInfo ? (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            htmlFor="creatorName"
            label="Creator / team name"
            required
            error={getFieldErrorMessage(errors, "creatorName")}
          >
            <TextInput
              id="creatorName"
              placeholder="Your project or team"
              maxLength={64}
              invalid={isFieldInvalid(errors, "creatorName")}
              {...register("creatorName")}
            />
          </FormField>
          <FormField
            htmlFor="creatorWebsite"
            label="Website"
            optional
            error={getFieldErrorMessage(errors, "creatorWebsite")}
          >
            <TextInput
              id="creatorWebsite"
              placeholder="https://example.com"
              inputMode="url"
              invalid={isFieldInvalid(errors, "creatorWebsite")}
              {...register("creatorWebsite")}
            />
          </FormField>
        </div>
      ) : null}
    </div>
  );
}
