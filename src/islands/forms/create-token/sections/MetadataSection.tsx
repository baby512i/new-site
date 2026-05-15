import type { UseFormReturn } from "react-hook-form";
import { FormSection } from "../../components/FormSection";
import { FormField } from "../../components/FormField";
import { TextInput } from "../../components/TextInput";
import { TextArea } from "../../components/TextArea";
import { ImageUploadField } from "../../components/ImageUploadField";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";
import type { PlatformFieldVisibility } from "../utils/get-platform-field-visibility";
import {
  getFieldErrorMessage,
  isFieldInvalid,
} from "../utils/form-errors";

interface MetadataSectionProps {
  id: string;
  visibility: PlatformFieldVisibility;
  form: UseFormReturn<CreateTokenValues>;
  /** Image File is held in island state, never inside RHF/Zod values. */
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
}

export function MetadataSection({
  id,
  visibility,
  form,
  imageFile,
  onImageChange,
}: MetadataSectionProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <FormSection
      id={id}
      title="Metadata"
      description="Describe the token and add the image and project links shown on explorers."
    >
      <FormField
        htmlFor="description"
        label="Description"
        optional
        error={getFieldErrorMessage(errors, "description")}
        hint="Up to 500 characters. Plain text, no HTML."
      >
        <TextArea
          id="description"
          placeholder="Short description of what the token represents."
          maxLength={500}
          invalid={isFieldInvalid(errors, "description")}
          {...register("description")}
        />
      </FormField>

      {visibility.showImageUpload ? (
        <ImageUploadField
          label="Token image"
          hint="PNG, JPEG, WebP, or GIF. Max 2 MB. Square images render best."
          value={imageFile}
          onChange={onImageChange}
        />
      ) : null}

      {visibility.showSocialLinks ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            htmlFor="website"
            label="Website"
            optional
            error={getFieldErrorMessage(errors, "website")}
            hint="Full URL including https://"
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
            htmlFor="twitter"
            label="X / Twitter"
            optional
            error={getFieldErrorMessage(errors, "twitter")}
            hint="Handle or full URL."
          >
            <TextInput
              id="twitter"
              placeholder="@yourproject"
              invalid={isFieldInvalid(errors, "twitter")}
              {...register("twitter")}
            />
          </FormField>
          <FormField
            htmlFor="telegram"
            label="Telegram"
            optional
            error={getFieldErrorMessage(errors, "telegram")}
            hint="Channel handle or invite link."
          >
            <TextInput
              id="telegram"
              placeholder="t.me/yourchannel"
              invalid={isFieldInvalid(errors, "telegram")}
              {...register("telegram")}
            />
          </FormField>
        </div>
      ) : null}
    </FormSection>
  );
}
