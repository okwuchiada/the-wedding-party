"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/lib/actions/auth";
import { AuthField, AuthMessage, AuthSubmit } from "./fields";

export default function SignupForm({ minPasswordLength }: { minPasswordLength: number }) {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <AuthField label="Your name" name="name" autoComplete="name" autoFocus required />
      <AuthField label="Email" type="email" name="email" autoComplete="email" required />
      <AuthField
        label={`Password (at least ${minPasswordLength} characters)`}
        type="password"
        name="password"
        autoComplete="new-password"
        minLength={minPasswordLength}
        required
      />
      <AuthMessage error={state?.error} />
      <AuthSubmit pending={pending} label="Create account" pendingLabel="Creating account…" />
      <p className="text-xs text-foreground/60">
        Already have an account?{" "}
        <Link href="/login" className="hover:text-burnt-orange">
          Sign in
        </Link>
      </p>
    </form>
  );
}
