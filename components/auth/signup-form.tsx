"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signup } from "@/lib/actions/auth";
import { PRIVACY, TERMS, type LegalDocument } from "@/lib/legal";
import { missingRequirements } from "@/lib/password-rules";
import { Checkbox } from "@/components/ui/checkbox";
import AuthField from "./auth-field";
import { AuthMessage, AuthSubmit, authLinkClass } from "./fields";
import LegalModal from "./legal-modal";
import PasswordField from "./password-field";

export default function SignupForm({ minPasswordLength }: { minPasswordLength: number }) {
  const [state, action, pending] = useActionState(signup, undefined);
  const [passwordError, setPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [openDoc, setOpenDoc] = useState<LegalDocument | null>(null);

  // Catch an unfinished password or an unticked box here, so nothing is sent and nothing is cleared.
  const checkBeforeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const data = new FormData(form);
    const missing = missingRequirements(String(data.get("password") ?? ""));
    const agreed = data.get("agreedToTerms") === "on";
    setPasswordError(missing ? `Your password still needs ${missing}.` : "");
    setTermsError(agreed ? "" : "Tick this box to continue");
    if (missing || !agreed) {
      e.preventDefault();
      form.querySelector<HTMLElement>(missing ? 'input[name="password"]' : "#agreedToTerms")?.focus();
    }
  };

  return (
    <form action={action} onSubmit={checkBeforeSubmit} noValidate className="flex flex-col gap-5">
      <AuthField label="Your name" name="name" autoComplete="name" autoFocus required maxLength={80} />
      <AuthField label="Email" type="email" name="email" autoComplete="email" required />
      <PasswordField
        label="Password"
        showStrength
        name="password"
        autoComplete="new-password"
        minLength={minPasswordLength}
        required
        error={passwordError}
      />
      <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2.5 text-sm text-ink/75">
        <Checkbox
          id="agreedToTerms"
          name="agreedToTerms"
          required
          aria-invalid={termsError ? true : undefined}
          aria-describedby={termsError ? "terms-error" : undefined}
          onCheckedChange={(checked) => checked === true && setTermsError("")}
          className="mt-0.5"
        />
        <label htmlFor="agreedToTerms">
          I agree to the{" "}
          <button type="button" onClick={() => setOpenDoc(TERMS)} className={authLinkClass}>
            Terms of Service
          </button>{" "}
          and{" "}
          <button type="button" onClick={() => setOpenDoc(PRIVACY)} className={authLinkClass}>
            Privacy Policy
          </button>
          .
        </label>
      </div>
      {termsError && (
        <p id="terms-error" className="pl-6.5 text-[13px] text-coral-deep">
          {termsError}
        </p>
      )}
      </div>
      <AuthMessage error={state?.error} />
      <AuthSubmit pending={pending} label="Create account" pendingLabel="Creating account…" />
      <p className="text-sm text-ink/70">
        Already have an account?{" "}
        <Link href="/login" className={authLinkClass}>
          Sign in
        </Link>
      </p>
      <LegalModal doc={openDoc} onClose={() => setOpenDoc(null)} />
    </form>
  );
}
