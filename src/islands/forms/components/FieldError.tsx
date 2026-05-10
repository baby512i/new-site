interface FieldErrorProps {
  id?: string;
  message?: string;
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="text-xs leading-5 text-[var(--color-danger-text)]"
    >
      {message}
    </p>
  );
}
