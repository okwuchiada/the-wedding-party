"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Password
        <input
          type="password"
          name="password"
          autoFocus
          className="border border-olive/20 bg-white px-3 py-2.5 text-sm text-foreground outline-none"
        />
      </label>

      {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-burnt-orange px-6 py-2.5 text-xs font-medium text-ivory transition-colors hover:bg-burnt-orange-dark disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
