"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { AuthField, AuthMessage, AuthSubmit, authLinkClass } from "./fields";

export default function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      {next && <input type="hidden" name="next" value={next} />}
      <AuthField label="Email" type="email" name="email" autoComplete="email" autoFocus required />
      <AuthField label="Password" type="password" name="password" autoComplete="current-password" required />
      <AuthMessage error={state?.error} />
      <AuthSubmit pending={pending} label="Sign in" pendingLabel="Signing in…" />
      <div className="flex flex-wrap justify-between gap-3 text-sm">
        <Link href="/forgot-password" className={authLinkClass}>
          Forgot your password?
        </Link>
        <span className="text-(--m-ink)/70">
          New here?{" "}
          <Link href="/signup" className={authLinkClass}>
            Create your site
          </Link>
        </span>
      </div>
    </form>
  );
}
