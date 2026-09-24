"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth";
import { AuthField, AuthMessage, AuthSubmit, authLinkClass } from "./fields";

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <AuthField label="Email" type="email" name="email" autoComplete="email" autoFocus required />
      <AuthMessage error={state?.error} message={state?.message} />
      <AuthSubmit pending={pending} label="Send reset link" pendingLabel="Sending…" />
      <Link href="/login" className={`self-start text-sm ${authLinkClass}`}>
        Back to sign in
      </Link>
    </form>
  );
}
