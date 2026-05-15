import type { UseFormReturn } from "react-hook-form";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";

type Form = UseFormReturn<CreateTokenValues>;

export function clearSocialLinkFields(form: Form): void {
  form.setValue("website" as never, undefined as never, { shouldValidate: true });
  form.setValue("telegram" as never, undefined as never, { shouldValidate: true });
  form.setValue("twitter" as never, undefined as never, { shouldValidate: true });
  form.clearErrors(["website", "telegram", "twitter"]);
}

export function clearCreatorInfoFields(form: Form): void {
  form.setValue("creatorName" as never, undefined as never, { shouldValidate: true });
  form.setValue("creatorWebsite" as never, undefined as never, { shouldValidate: true });
  form.clearErrors(["creatorName", "creatorWebsite"]);
}

export function clearVanityAddressFields(form: Form): void {
  form.setValue("vanityPrefix" as never, undefined as never, { shouldValidate: true });
  form.setValue("vanitySuffix" as never, undefined as never, { shouldValidate: true });
  form.setValue("vanityCaseSensitive" as never, false as never, { shouldValidate: true });
  form.clearErrors(["vanityPrefix", "vanitySuffix", "vanityCaseSensitive"]);
}

export function clearAdvancedOptionFields(form: Form): void {
  form.setValue("includeCreatorInfo" as never, false as never, { shouldValidate: true });
  form.setValue("includeVanityAddress" as never, false as never, { shouldValidate: true });
  clearCreatorInfoFields(form);
  clearVanityAddressFields(form);
}
