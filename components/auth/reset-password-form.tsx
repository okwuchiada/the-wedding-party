"use client";

import { useActionState } from "react";
import { resetPassword } from "@/lib/actions/auth";
import { AuthField, AuthMessage, AuthSubmit } from "./fields";

export default function ResetPasswordForm({
  token,
  email,
  minPasswordLength,
}: {
  token: string;
  email: string;
  minPasswordLength: number;
}) {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      {/* Lets password managers save the new password against the right account. */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <p className="rounded-[6px] bg-(--m-paper) px-3 py-2 text-sm text-(--m-ink)/75">{email}</p>
      <AuthField
        label="New password"
        hint={`At least ${minPasswordLength} characters`}
        type="password"
        name="password"
        autoComplete="new-password"
        minLength={minPasswordLength}
        autoFocus
        required
      />
      <AuthField label="Confirm password" type="password" name="confirm" autoComplete="new-password" required />
      <AuthMessage error={state?.error} />
      <AuthSubmit pending={pending} label="Save password" pendingLabel="Saving…" />
    </form>
  );
}
