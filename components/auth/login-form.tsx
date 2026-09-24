"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { AuthField, AuthMessage, AuthSubmit } from "./fields";

export default function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <AuthField label="Email" type="email" name="email" autoComplete="email" autoFocus required />
      <AuthField label="Password" type="password" name="password" autoComplete="current-password" required />
      <AuthMessage error={state?.error} />
      <AuthSubmit pending={pending} label="Sign in" pendingLabel="Signing in…" />
      <div className="flex justify-between text-xs text-foreground/60">
        <Link href="/forgot-password" className="hover:text-burnt-orange">
          Forgot password?
        </Link>
        <Link href="/signup" className="hover:text-burnt-orange">
          Create an account
        </Link>
      </div>
    </form>
  );
}
