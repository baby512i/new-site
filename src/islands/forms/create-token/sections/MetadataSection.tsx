import type { UseFormReturn } from "react-hook-form";
import { FormSection } from "../../components/FormSection";
import { FormField } from "../../components/FormField";
import { TextArea } from "../../components/TextArea";
import { ImageUploadField } from "../../components/ImageUploadField";
import { SocialLinksFields } from "../fields/SocialLinksFields";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";
import type { PlatformFieldVisibility } from "../utils/get-platform-field-visibility";
import {
  getFieldErrorMessage,
  isFieldInvalid,
} from "../utils/form-errors";

/** Shared control height for image + description row. */
const METADATA_CONTROL_HEIGHT = "h-[11.5rem]";

interface MetadataSectionProps {
  id: string;
  visibility: PlatformFieldVisibility;
  form: UseFormReturn<CreateTokenValues>;
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
  imageError?: string;
  onImageBlur?: () => void;
}

export function MetadataSection({
  id,
  visibility,
  form,
  imageFile,
  onImageChange,
  imageError,
  onImageBlur,
}: MetadataSectionProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <FormSection
      id={id}
      title="Metadata"
      description="Add an image and description shown on explorers."
    >
      <div
        className={[
          "grid gap-4",
          visibility.showImageUpload ? "md:grid-cols-2 md:items-stretch" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {visibility.showImageUpload ? (
          <ImageUploadField
            fieldId="tokenImage"
            label="Token Image"
            required
            controlClassName={METADATA_CONTROL_HEIGHT}
            value={imageFile}
            onChange={onImageChange}
            onBlur={onImageBlur}
            error={imageError}
          />
        ) : null}

        <FormField
          htmlFor="description"
          label="Description"
          error={getFieldErrorMessage(errors, "description")}
        >
          <TextArea
            id="description"
            placeholder="Describe your token and its purpose"
            maxLength={500}
            rows={1}
            invalid={isFieldInvalid(errors, "description")}
            className={`${METADATA_CONTROL_HEIGHT} max-h-[11.5rem] min-h-[11.5rem] resize-none`}
            {...register("description")}
          />
        </FormField>
      </div>
      <SocialLinksFields form={form} visible={visibility.showSocialLinks} />
    </FormSection>
  );
}
