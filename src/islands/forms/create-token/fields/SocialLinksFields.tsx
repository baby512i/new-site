import { Controller, type UseFormReturn } from "react-hook-form";
import { FormField } from "../../components/FormField";
import { SwitchField } from "../../components/SwitchField";
import { TextInput } from "../../components/TextInput";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";
import {
  getFieldErrorMessage,
  isFieldInvalid,
} from "../utils/form-errors";
import { clearSocialLinkFields } from "../utils/reset-conditional-fields";

interface SocialLinksFieldsProps {
  form: UseFormReturn<CreateTokenValues>;
  visible: boolean;
}

export function SocialLinksFields({ form, visible }: SocialLinksFieldsProps) {
  const {
    control,
    register,
    formState: { errors },
  } = form;

  if (!visible) return null;

  return (
    <div className="grid gap-4">
      <Controller
        name={"includeSocialLinks" as never}
        control={control}
        render={({ field }) => (
          <SwitchField
            id="includeSocialLinks"
            label="Include social links"
            description="Add website and social profiles to token metadata."
            checked={Boolean(field.value)}
            onCheckedChange={(checked) => {
              field.onChange(checked);
              if (!checked) clearSocialLinkFields(form);
            }}
            onBlur={field.onBlur}
            ref={field.ref}
          />
        )}
      />

      {form.watch("includeSocialLinks" as never) ? (
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            htmlFor="website"
            label="Website"
            optional
            error={getFieldErrorMessage(errors, "website")}
          >
            <TextInput
              id="website"
              placeholder="https://example.com"
              inputMode="url"
              invalid={isFieldInvalid(errors, "website")}
              {...register("website")}
            />
          </FormField>
          <FormField
            htmlFor="telegram"
            label="Telegram"
            optional
            error={getFieldErrorMessage(errors, "telegram")}
          >
            <TextInput
              id="telegram"
              placeholder="t.me/yourchannel"
              invalid={isFieldInvalid(errors, "telegram")}
              {...register("telegram")}
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField
              htmlFor="twitter"
              label="X / Twitter"
              optional
              error={getFieldErrorMessage(errors, "twitter")}
            >
              <TextInput
                id="twitter"
                placeholder="@yourproject"
                invalid={isFieldInvalid(errors, "twitter")}
                {...register("twitter")}
              />
            </FormField>
          </div>
        </div>
      ) : null}
    </div>
  );
}
