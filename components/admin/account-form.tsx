"use client";

import { Lock } from "lucide-react";
import { startTransition, useActionState } from "react";
import { saveAccountProfile } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { useSuccessToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

const label = "flex flex-col gap-1.5 text-sm font-medium";

/** A couple's own name and phone; the sign-in email is shown but locked. */
export default function AccountForm({ email, name, phone }: { email: string; name: string; phone: string }) {
  const [state, formAction, pending] = useActionState(saveAccountProfile, undefined);
  useSuccessToast(state, "Account saved");

  return (
    <form
      // Submitted by hand so React doesn't reset the fields after saving.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col gap-5 rounded-[6px] border border-border bg-card p-5 sm:p-6"
    >
      <div className={label}>
        <span id="account-email">Sign-in email</span>
        <p
          aria-labelledby="account-email"
          className="flex items-center justify-between gap-3 border border-border bg-paper px-3 py-2.5 text-sm font-normal text-muted-foreground"
        >
          {email}
          <Lock aria-hidden size={15} className="shrink-0 text-muted-foreground" />
        </p>
        <span className="text-xs font-normal text-muted-foreground">
          This is the email you signed up with, so it can&apos;t be changed. Contact support if you&apos;ve lost access to it.
        </span>
      </div>
      <Label className={label}>
        Full name
        <Input name="name" defaultValue={name} required minLength={2} maxLength={100} autoComplete="name" />
      </Label>
      <Label className={label}>
        Phone <span className="text-xs font-normal text-muted-foreground">Optional. Only Vowly support sees this, to help with your account.</span>
        <PhoneInput name="phone" defaultValue={phone} maxLength={20} placeholder="+234 803 123 4567" />
      </Label>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
        <span aria-live="polite" className="text-sm">
          {state?.error && <span className="text-destructive">{state.error}</span>}
        </span>
      </div>
    </form>
  );
}
