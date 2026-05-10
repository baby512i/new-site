import { useEffect, useId, useRef, useState } from "react";
import { FieldError } from "./FieldError";
import { HelpText } from "./HelpText";

interface ImageUploadFieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  /** Maximum file size in MB. Default 2. */
  maxSizeMb?: number;
  accept?: string;
  /** Currently selected file. The parent owns the value. */
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

const ACCEPT_DEFAULT = ALLOWED_IMAGE_TYPES.join(",");

export function ImageUploadField({
  label,
  hint,
  required = false,
  maxSizeMb = 2,
  accept = ACCEPT_DEFAULT,
  value,
  onChange,
  error,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const handleChange = (file: File | null) => {
    setLocalError(null);

    if (!file) {
      onChange(null);
      return;
    }

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
      )
    ) {
      setLocalError("Use PNG, JPEG, WebP, or GIF.");
      onChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setLocalError(`Image is too large. Maximum is ${maxSizeMb} MB.`);
      onChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    onChange(file);
  };

  const messageId = `${inputId}-message`;
  const visibleError = error ?? localError ?? undefined;

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--color-text)]"
        >
          {label}
          {required ? (
            <span className="ml-1 text-[var(--color-danger-text)]" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      </div>

      <div className="grid gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--card)] p-4 sm:grid-cols-[5rem_1fr] sm:items-center">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Token image preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              Preview
            </span>
          )}
        </div>

        <div className="grid gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            aria-describedby={messageId}
            aria-invalid={visibleError ? "true" : undefined}
            onChange={(e) => handleChange(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-[var(--color-text-secondary)] file:mr-3 file:cursor-pointer file:rounded-[var(--radius-md)] file:border file:border-[var(--color-border)] file:bg-[var(--color-surface-muted)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--color-text)] hover:file:border-[var(--color-brand-border)] hover:file:bg-[var(--color-brand-soft)] hover:file:text-[var(--color-brand-text)]"
          />

          <div id={messageId}>
            {visibleError ? (
              <FieldError message={visibleError} />
            ) : hint ? (
              <HelpText>{hint}</HelpText>
            ) : null}
          </div>

          {value ? (
            <button
              type="button"
              onClick={() => {
                handleChange(null);
              }}
              className="justify-self-start rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-danger-border)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger-text)]"
            >
              Remove image
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
