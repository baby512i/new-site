import { useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { FormField } from "../../components/FormField";
import { SwitchField } from "../../components/SwitchField";
import { TextInput } from "../../components/TextInput";
import type { CreateTokenValues } from "../../../../lib/validation/create-token/create-token.schema";
import {
  getFieldErrorMessage,
  isFieldInvalid,
} from "../utils/form-errors";
import { clearVanityAddressFields } from "../utils/reset-conditional-fields";

interface VanityAddressFieldsProps {
  form: UseFormReturn<CreateTokenValues>;
  /** When false, the parent section supplies the title. */
  showHeading?: boolean;
}

export function VanityAddressFields({
  form,
  showHeading = true,
}: VanityAddressFieldsProps) {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form;

  const includeVanity = watch("includeVanityAddress" as never);
  const [isRunning, setIsRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleStart = () => {
    setIsRunning(true);
    setAttempts(0);
    // Placeholder — real generation will be lazy-loaded in a Web Worker later.
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleVanityToggle = (checked: boolean, onChange: (value: boolean) => void) => {
    onChange(checked);
    if (!checked) {
      clearVanityAddressFields(form);
      setIsRunning(false);
      setAttempts(0);
    }
  };

  return (
    <div className="grid gap-4">
      {showHeading ? (
        <Controller
          name={"includeVanityAddress" as never}
          control={control}
          render={({ field }) => (
            <SwitchField
              id="includeVanityAddress"
              label="Custom address generator"
              description="Customize the beginning and/or end of your token mint address."
              badge={{ label: "Free", tone: "success" }}
              checked={Boolean(field.value)}
              onCheckedChange={(checked) =>
                handleVanityToggle(checked, field.onChange)
              }
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
      ) : (
        <Controller
          name={"includeVanityAddress" as never}
          control={control}
          render={({ field }) => (
            <SwitchField
              id="includeVanityAddress"
              label="Enable custom address"
              description="Customize the beginning and/or end of your token mint address."
              badge={{ label: "Free", tone: "success" }}
              checked={Boolean(field.value)}
              onCheckedChange={(checked) =>
                handleVanityToggle(checked, field.onChange)
              }
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
      )}

      {includeVanity ? (
        <>
          <p className="rounded-[var(--radius-md)] border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] px-3 py-2 text-xs leading-5 text-[var(--color-warning-text)]">
            Recommend no more than 4 characters; longer patterns take much longer.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              htmlFor="vanityPrefix"
              label="Prefix"
              optional
              error={getFieldErrorMessage(errors, "vanityPrefix")}
            >
              <TextInput
                id="vanityPrefix"
                placeholder="e.g. DX"
                maxLength={4}
                invalid={isFieldInvalid(errors, "vanityPrefix")}
                {...register("vanityPrefix")}
              />
            </FormField>
            <FormField
              htmlFor="vanitySuffix"
              label="Suffix"
              optional
              error={getFieldErrorMessage(errors, "vanitySuffix")}
            >
              <TextInput
                id="vanitySuffix"
                placeholder="e.g. RA"
                maxLength={4}
                invalid={isFieldInvalid(errors, "vanitySuffix")}
                {...register("vanitySuffix")}
              />
            </FormField>
          </div>

          <Controller
            name={"vanityCaseSensitive" as never}
            control={control}
            render={({ field }) => (
              <SwitchField
                id="vanityCaseSensitive"
                label="Case sensitive"
                description="Match uppercase and lowercase exactly in the pattern."
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />

          <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleStart}
                disabled={isRunning}
                className="inline-flex min-h-[var(--control-md)] items-center justify-center rounded-[var(--radius-md)] border border-transparent bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-soft)]"
              >
                Start
              </button>
              <button
                type="button"
                onClick={handleStop}
                disabled={!isRunning}
                className="inline-flex min-h-[var(--control-md)] items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--color-text)] hover:border-[var(--color-brand-border)] disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-soft)]"
              >
                Stop
              </button>
            </div>
            <dl className="grid gap-2 text-xs sm:grid-cols-2">
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-[var(--color-text-muted)]">Attempts</dt>
                <dd className="font-semibold text-[var(--color-text)]">
                  {attempts.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-[var(--color-text-muted)]">Speed</dt>
                <dd className="font-semibold text-[var(--color-text)]">—</dd>
              </div>
              <div className="flex justify-between gap-2 sm:block">
                <dt className="text-[var(--color-text-muted)]">Est. time</dt>
                <dd className="font-semibold text-[var(--color-text)]">—</dd>
              </div>
              <div className="flex justify-between gap-2 sm:block sm:col-span-2">
                <dt className="text-[var(--color-text-muted)]">Status</dt>
                <dd className="font-semibold text-[var(--color-text)]">
                  {isRunning ? "Searching (preview)" : "Idle"}
                </dd>
              </div>
            </dl>
          </div>
        </>
      ) : null}
    </div>
  );
}
