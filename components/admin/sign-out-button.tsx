"use client";

import { useFormStatus } from "react-dom";

export default function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="border rounded-full border-(--m-ink)/25 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-(--m-ink) disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
