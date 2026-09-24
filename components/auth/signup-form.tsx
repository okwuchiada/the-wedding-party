"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/lib/actions/auth";
import { AuthField, AuthMessage, AuthSubmit, authLinkClass } from "./fields";

export default function SignupForm({ minPasswordLength }: { minPasswordLength: number }) {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <AuthField label="Your name" name="name" autoComplete="name" autoFocus required />
      <AuthField label="Email" type="email" name="email" autoComplete="email" required />
      <AuthField
        label="Password"
        hint={`At least ${minPasswordLength} characters`}
        type="password"
        name="password"
        autoComplete="new-password"
        minLength={minPasswordLength}
        required
      />
      <AuthMessage error={state?.error} />
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
