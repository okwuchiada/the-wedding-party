"use client";

import { useFormStatus } from "react-dom";

export default function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-olive/30 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-burnt-orange hover:text-burnt-orange disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
