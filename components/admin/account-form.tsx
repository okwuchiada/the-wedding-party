"use client";

import { Lock } from "lucide-react";
import { startTransition, useActionState } from "react";
import { saveAccountProfile } from "@/lib/actions/account";

const field = "w-full border border-(--m-mist) bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-(--m-ink)/50";
const label = "flex flex-col gap-1.5 text-sm font-medium";

/** A couple's own name and phone; the sign-in email is shown but locked. */
export default function AccountForm({ email, name, phone }: { email: string; name: string; phone: string }) {
  const [state, formAction, pending] = useActionState(saveAccountProfile, undefined);

  return (
    <form
      // Submitted by hand so React doesn't reset the fields after saving.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col gap-5 rounded-[6px] border border-(--m-mist) bg-white p-5 sm:p-6"
    >
      <div className={label}>
        <span id="account-email">Sign-in email</span>
        <p
          aria-labelledby="account-email"
          className="flex items-center justify-between gap-3 border border-(--m-mist) bg-(--m-paper) px-3 py-2.5 text-sm font-normal text-foreground/75"
        >
          {email}
          <Lock aria-hidden size={15} className="shrink-0 text-foreground/45" />
        </p>
        <span className="text-xs font-normal text-foreground/55">
          This is the email you signed up with, so it can&apos;t be changed. Contact support if you&apos;ve lost access to it.
        </span>
      </div>
      <label className={label}>
        Full name
        <input name="name" defaultValue={name} required minLength={2} maxLength={100} autoComplete="name" className={field} />
      </label>
      <label className={label}>
        Phone <span className="text-xs font-normal text-foreground/55">Optional. Only Vowly support sees this, to help with your account.</span>
        <input name="phone" type="tel" defaultValue={phone} maxLength={20} placeholder="+234 803 123 4567" autoComplete="tel" className={field} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-(--m-gold) px-5 py-2.5 text-sm font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper) disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <span aria-live="polite" className="text-sm">
          {state?.error && <span className="text-(--m-coral-deep)">{state.error}</span>}
          {state?.message && <span className="text-(--m-emerald)">{state.message}</span>}
        </span>
      </div>
    </form>
  );
}
