"use client";

import { useActionState, useState } from "react";
import { changeTemporaryPassword } from "@/lib/actions/auth";
import { missingRequirements } from "@/lib/password-rules";
import { AuthMessage, AuthSubmit } from "./fields";
import PasswordField from "./password-field";

/** Choose your own password after signing in with a temporary one. */
export default function ChangePasswordForm({ email, next, minPasswordLength }: { email: string; next?: string; minPasswordLength: number }) {
  const [state, action, pending] = useActionState(changeTemporaryPassword, undefined);
  const [clientError, setClientError] = useState("");
  // Any edit hides the last error; a failed retry shows the new one.
  const [dismissed, setDismissed] = useState<typeof state>(undefined);
  const serverError = state && state !== dismissed ? state.error : undefined;

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
    <form
      action={action}
      onSubmit={checkBeforeSubmit}
      onChange={() => {
        setClientError("");
        setDismissed(state);
      }}
      noValidate
      className="flex flex-col gap-5"
    >
      {next && <input type="hidden" name="next" value={next} />}
      {/* Lets password managers save the new password against the right account. */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <p className="rounded-[6px] bg-(--m-paper) px-3 py-2 text-sm text-(--m-ink)/75">{email}</p>
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
      <AuthMessage error={clientError || serverError} />
      <AuthSubmit pending={pending} label="Save my password" pendingLabel="Saving…" />
    </form>
  );
}
