import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ToastContext,
  type ToastInput,
  type ToastRecord,
  type ToastTone,
} from "./useToast";
import { ToastViewport } from "./ToastViewport";

interface ToastProviderProps {
  children: ReactNode;
}

function createToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = input.id ?? createToastId();
      const tone: ToastTone = input.tone ?? "info";
      const record: ToastRecord = { ...input, id, tone };

      setToasts((current) => [...current, record]);

      const durationMs = input.durationMs ?? 6000;
      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      push,
      dismiss,
      info: (title: string, description?: string) =>
        push({ title, description, tone: "info" }),
      success: (title: string, description?: string) =>
        push({ title, description, tone: "success" }),
      warning: (title: string, description?: string) =>
        push({ title, description, tone: "warning" }),
      error: (title: string, description?: string) =>
        push({ title, description, tone: "error", durationMs: 8000 }),
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
