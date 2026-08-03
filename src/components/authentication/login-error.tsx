interface LoginErrorProps {
  message?: string | null;
}

export function LoginError({ message }: LoginErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {message}
    </div>
  );
}
