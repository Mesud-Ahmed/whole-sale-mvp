"use client";

export function FormMessage({ state }: { state: unknown }) {
  if (!state || typeof state !== "object" || !("message" in state)) return null;
  const typed = state as { ok?: boolean; message?: string };

  return (
    <p className={typed.ok ? "text-sm font-medium text-success" : "text-sm font-medium text-danger"}>
      {typed.message}
    </p>
  );
}
