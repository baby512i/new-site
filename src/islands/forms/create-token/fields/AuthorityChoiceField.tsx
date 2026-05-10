import { TextInput } from "../../components/TextInput";
import { RadioCards } from "../../components/RadioCards";
import { FieldError } from "../../components/FieldError";

export type AuthorityChoiceKind = "self" | "address" | "revoke";

/**
 * Mirrors the Zod `authorityChoice` discriminated union used on Tax Token
 * authority fields. Keeping the shapes tight here means RHF's `setValue` does
 * not need any cast at the call site.
 */
export type AuthorityChoiceValue =
  | { kind: "self" }
  | { kind: "address"; address: string }
  | { kind: "revoke"; confirm: true };

interface AuthorityChoiceFieldProps {
  /** Used to scope radio + input ids so the same field can appear twice on a page. */
  namePrefix: string;
  label: string;
  description: string;
  value: AuthorityChoiceValue;
  onChange: (next: AuthorityChoiceValue) => void;
  addressError?: string;
}

/**
 * Three-way authority chooser: keep with my wallet / specific address / revoke.
 *
 * Used for `transferFeeAuthority` and `withdrawWithheldAuthority` on Tax Token.
 * The schema's discriminated union expects:
 *   - { kind: "self" }
 *   - { kind: "address", address: <base58> }
 *   - { kind: "revoke", confirm: true }
 */
export function AuthorityChoiceField({
  namePrefix,
  label,
  description,
  value,
  onChange,
  addressError,
}: AuthorityChoiceFieldProps) {
  return (
    <fieldset className="grid gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--card)] p-4">
      <legend className="text-sm font-medium text-[var(--color-text)]">
        {label}
      </legend>
      <p className="text-xs leading-5 text-[var(--color-text-muted)]">
        {description}
      </p>

      <RadioCards<AuthorityChoiceKind>
        name={namePrefix}
        value={value.kind}
        onChange={(nextKind) => {
          if (nextKind === "self") {
            onChange({ kind: "self" });
          } else if (nextKind === "address") {
            const previousAddress =
              value.kind === "address" ? value.address : "";
            onChange({ kind: "address", address: previousAddress });
          } else {
            onChange({ kind: "revoke", confirm: true });
          }
        }}
        options={[
          {
            value: "self",
            label: "My wallet",
            description: "The connecting wallet keeps this authority.",
          },
          {
            value: "address",
            label: "Specific address",
            description: "A different Solana wallet controls this authority.",
          },
          {
            value: "revoke",
            label: "Revoke",
            description: "Permanent. No one can change this setting later.",
          },
        ]}
        columns={3}
      />

      {value.kind === "address" ? (
        <div className="grid gap-1.5">
          <label
            htmlFor={`${namePrefix}-address`}
            className="text-sm font-medium text-[var(--color-text)]"
          >
            Authority address
          </label>
          <TextInput
            id={`${namePrefix}-address`}
            placeholder="Solana base58 address"
            value={value.address}
            invalid={Boolean(addressError)}
            onChange={(event) =>
              onChange({ kind: "address", address: event.currentTarget.value })
            }
          />
          <FieldError message={addressError} />
        </div>
      ) : null}

      {value.kind === "revoke" ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] px-3 py-2 text-xs leading-5 text-[var(--color-danger-text)]">
          Permanent. Once revoked, this authority cannot be restored or
          transferred.
        </p>
      ) : null}
    </fieldset>
  );
}
