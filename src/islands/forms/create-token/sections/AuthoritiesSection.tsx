import type { UseFormReturn } from "react-hook-form";
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

/**
 * Permanent authority switches: revoke mint, revoke freeze, lock metadata.
 * Only rendered for platforms that expose these toggles.
 */
export function AuthoritiesSection({
  id,
  platform,
  visibility,
  form,
}: AuthoritiesSectionProps) {
  const { register } = form;

  if (!visibility.showAuthorities) return null;

  return (
    <FormSection
      id={id}
      title="Authorities & safety"
      description="These switches change long-term token behaviour. Each one is permanent once the transaction confirms."
    >
      {platform.supports.revokeMintAuthority ? (
        <SwitchField
          id="revokeMintAuthority"
          label="Revoke mint authority"
          description="No one will be able to mint additional supply. Permanent."
          tone="danger"
          {...register("revokeMintAuthority" as never)}
        />
      ) : null}

      {platform.supports.revokeFreezeAuthority ? (
        <SwitchField
          id="revokeFreezeAuthority"
          label="Revoke freeze authority"
          description="No one will be able to freeze holder accounts. Permanent."
          tone="danger"
          {...register("revokeFreezeAuthority" as never)}
        />
      ) : null}

      {platform.supports.makeImmutable ? (
        <SwitchField
          id="makeImmutable"
          label="Make metadata immutable"
          description="Name, symbol, and image cannot be updated later. Permanent."
          tone="danger"
          {...register("makeImmutable" as never)}
        />
      ) : null}
    </FormSection>
  );
}
