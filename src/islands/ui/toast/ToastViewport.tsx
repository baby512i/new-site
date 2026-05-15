import type { ToastRecord } from "./useToast";

interface ToastViewportProps {
  toasts: ToastRecord[];
  onDismiss: (id: string) => void;
}

const toneStyles: Record<ToastRecord["tone"], string> = {
  info: "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]",
  success:
    "border-[var(--color-success-border)] bg-[var(--color-success-soft)] text-[var(--color-success-text)]",
  warning:
    "border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] text-[var(--color-warning-text)]",
  error:
    "border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] text-[var(--color-danger-text)]",
};

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={[
            "pointer-events-auto grid w-full max-w-sm gap-1 rounded-[var(--radius-lg)] border px-4 py-3 shadow-[var(--shadow-sm)]",
            toneStyles[toast.tone],
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold leading-[var(--leading-title)]">
              {toast.title}
            </p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-transparent text-current hover:border-current/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-soft)]"
              aria-label="Dismiss notification"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          {toast.description ? (
            <p className="text-xs leading-5 opacity-90">{toast.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
