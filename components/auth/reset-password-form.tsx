"use client";

import { useActionState, useState } from "react";
import { resetPassword } from "@/lib/actions/auth";
import { missingRequirements } from "@/lib/password-rules";
import { AuthMessage, AuthSubmit } from "./fields";
import PasswordField from "./password-field";

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
  const [clientError, setClientError] = useState("");

  // Catch an unfinished or mismatched password here, so nothing is sent and nothing is cleared.
  const checkBeforeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const missing = missingRequirements(password);
    const problem = missing
      ? { message: `Your password still needs ${missing}.`, field: "password" }
      : password !== form.get("confirm")
        ? { message: "The two passwords don't match yet.", field: "confirm" }
        : null;
    if (problem) {
      e.preventDefault();
      setClientError(problem.message);
      e.currentTarget.querySelector<HTMLInputElement>(`input[name="${problem.field}"]`)?.focus();
    } else {
      setClientError("");
    }
  };

  return (
    <form action={action} onSubmit={checkBeforeSubmit} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      {/* Lets password managers save the new password against the right account. */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <p className="rounded-md bg-paper px-3 py-2 text-sm text-ink/75">{email}</p>
      <PasswordField
        label="New password"
        showStrength
        name="password"
        autoComplete="new-password"
        minLength={minPasswordLength}
        autoFocus
        required
      />
      <PasswordField label="Confirm password" name="confirm" autoComplete="new-password" required />
      <AuthMessage error={clientError || state?.error} />
      <AuthSubmit pending={pending} label="Save password" pendingLabel="Saving…" />
    </form>
  );
}
