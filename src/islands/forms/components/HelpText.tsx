import type { ReactNode } from "react";

interface HelpTextProps {
  id?: string;
  children: ReactNode;
  tone?: "muted" | "warning";
}

export function HelpText({ id, children, tone = "muted" }: HelpTextProps) {
  const toneClass =
    tone === "warning"
      ? "text-[var(--color-warning-text)]"
      : "text-[var(--color-text-muted)]";
  return (
    <p id={id} className={`text-xs leading-5 ${toneClass}`}>
      {children}
    </p>
  );
}
