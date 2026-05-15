import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { FieldError } from "./FieldError";

interface ImageUploadFieldProps {
  /** Stable id for scroll/focus when validating outside RHF. */
  fieldId?: string;
  label: string;
  required?: boolean;
  /** Maximum file size in MB. Default 2. */
  maxSizeMb?: number;
  accept?: string;
  /** Currently selected file. The parent owns the value. */
  value: File | null;
  onChange: (file: File | null) => void;
  onBlur?: () => void;
  error?: string;
  /** Fixed height class for the drop zone (must match paired fields). */
  controlClassName?: string;
}

const DEFAULT_CONTROL_HEIGHT = "h-[11.5rem]";

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

const ACCEPT_DEFAULT = ALLOWED_IMAGE_TYPES.join(",");

function ImagePlaceholderIcon() {
  return (
    <svg
      className="h-10 w-10 text-[var(--color-text-muted)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export function ImageUploadField({
  fieldId,
  label,
  required = false,
  maxSizeMb = 2,
  accept = ACCEPT_DEFAULT,
  value,
  onChange,
  onBlur,
  error,
  controlClassName = DEFAULT_CONTROL_HEIGHT,
}: ImageUploadFieldProps) {
  const autoInputId = useId();
  const inputId = fieldId ? `${fieldId}-input` : autoInputId;
  const rootId = fieldId ?? inputId;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
      )
    ) {
      setLocalError("Use PNG, JPG, or WEBP.");
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

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleChange(file);
  };

  const messageId = `${inputId}-message`;
  const visibleError = error ?? localError ?? undefined;
  const formatHint = `PNG, JPG, or WEBP (max. ${maxSizeMb} MB)`;

  return (
    <div id={rootId} className="grid h-full min-h-0 gap-1.5">
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

      <div
        className={[
          controlClassName,
          "min-h-0 shrink-0 overflow-hidden",
        ].join(" ")}
      >
        <div
          role="button"
          tabIndex={0}
          aria-describedby={messageId}
          aria-invalid={visibleError ? "true" : undefined}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFilePicker();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={[
            "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed p-3 text-center transition-colors",
            visibleError
              ? "border-[var(--color-danger-border)] bg-[var(--color-danger-soft)]"
              : isDragging
                ? "border-[var(--color-brand-border)] bg-[var(--color-brand-soft)]"
                : "border-[var(--color-border-strong)] bg-[var(--card)] hover:border-[var(--color-brand-border)]",
          ].join(" ")}
        >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => handleChange(event.target.files?.[0] ?? null)}
          onBlur={onBlur}
        />

        {previewUrl ? (
          <div className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-1.5">
            <div className="flex min-h-0 w-full flex-1 items-center justify-center">
              <img
                src={previewUrl}
                alt="Token image preview"
                className="max-h-full max-w-full rounded-[var(--radius-md)] object-contain"
              />
            </div>
            <p className="w-full truncate px-1 text-xs text-[var(--color-text-muted)]">
              {value?.name}
            </p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleChange(null);
              }}
              className="shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-danger-border)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger-text)]"
            >
              Remove image
            </button>
          </div>
        ) : (
          <>
            <ImagePlaceholderIcon />
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Drag &amp; drop image
            </p>
            <p className="text-xs leading-5 text-[var(--color-text-muted)]">
              {formatHint}
            </p>
          </>
        )}
        </div>
      </div>

      <div id={messageId}>
        {visibleError ? <FieldError message={visibleError} /> : null}
      </div>
    </div>
  );
}
