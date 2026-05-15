import { Controller, type UseFormReturn } from "react-hook-form";
import { FormSection } from "../../components/FormSection";
import { SwitchField } from "../../components/SwitchField";
import type { CreateTokenPlatformConfig } from "../../../../lib/tool-config/create-token-platforms";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";
import type { PlatformFieldVisibility } from "../utils/get-platform-field-visibility";

interface AuthoritiesSectionProps {
  id: string;
  platform: CreateTokenPlatformConfig;
  visibility: PlatformFieldVisibility;
  form: UseFormReturn<CreateTokenValues>;
}

export function AuthoritiesSection({
  id,
  platform,
  visibility,
  form,
}: AuthoritiesSectionProps) {
  const { control } = form;

  if (!visibility.showAuthorities) return null;

  return (
    <FormSection
      id={id}
      title="Authorities & safety"
      description="These options change long-term token behaviour. Each one is permanent once the transaction confirms."
    >
      <div className="grid gap-3">
        {platform.supports.revokeMintAuthority ? (
          <Controller
            name={"revokeMintAuthority" as never}
            control={control}
            render={({ field }) => (
              <SwitchField
                id="revokeMintAuthority"
                label="Revoke mint authority"
                description="Permanently disables future minting."
                badge={{ label: "Free", tone: "success" }}
                tone={field.value ? "warning" : "default"}
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
        ) : null}

        {platform.supports.revokeFreezeAuthority ? (
          <Controller
            name={"revokeFreezeAuthority" as never}
            control={control}
            render={({ field }) => (
              <SwitchField
                id="revokeFreezeAuthority"
                label="Revoke freeze authority"
                description="Prevents freezing token accounts in the future."
                badge={{ label: "Free", tone: "success" }}
                tone={field.value ? "warning" : "default"}
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
        ) : null}

        {platform.supports.makeImmutable ? (
          <Controller
            name={"makeImmutable" as never}
            control={control}
            render={({ field }) => (
              <SwitchField
                id="makeImmutable"
                label="Make metadata immutable"
                description="Prevents future metadata changes."
                badge={{ label: "Free", tone: "success" }}
                tone={field.value ? "warning" : "default"}
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
        ) : null}
      </div>
    </FormSection>
  );
}
