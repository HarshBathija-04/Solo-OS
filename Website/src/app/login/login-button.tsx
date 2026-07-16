"use client";

import { LogIn, Loader2 } from "lucide-react";

export function LoginButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
      {pending ? "Binding…" : label}
    </button>
  );
}
