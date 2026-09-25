"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signup } from "@/lib/actions/auth";
import { missingRequirements } from "@/lib/password-rules";
import AuthField from "./auth-field";
import { AuthMessage, AuthSubmit, authLinkClass } from "./fields";
import PasswordField from "./password-field";

export default function SignupForm({ minPasswordLength }: { minPasswordLength: number }) {
  const [state, action, pending] = useActionState(signup, undefined);
  const [clientError, setClientError] = useState("");

  // Catch an unfinished password here, so nothing is sent and nothing is cleared.
  const checkBeforeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    const missing = missingRequirements(password);
    if (missing) {
      e.preventDefault();
      setClientError(`Your password still needs ${missing}.`);
      e.currentTarget.querySelector<HTMLInputElement>('input[name="password"]')?.focus();
    } else {
      setClientError("");
    }
  };

  return (
    <form action={action} onSubmit={checkBeforeSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-3">
        <AuthField label="Your name" name="name" autoComplete="name" autoFocus required maxLength={80} />
        <AuthField label="Your partner's name" name="partnerName" autoComplete="off" required maxLength={80} />
      </div>
      <AuthField label="Email" type="email" name="email" autoComplete="email" required />
      <PasswordField
        label="Password"
        showStrength
        name="password"
        autoComplete="new-password"
        minLength={minPasswordLength}
        required
      />
      <AuthMessage error={clientError || state?.error} />
      <AuthSubmit pending={pending} label="Create account" pendingLabel="Creating account…" />
      <p className="text-sm text-(--m-ink)/70">
        Already have an account?{" "}
        <Link href="/login" className={authLinkClass}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
