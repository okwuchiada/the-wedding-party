"use client";

import { useActionState } from "react";
import { setCustomDomain } from "@/lib/actions/super";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";

export default function DomainForm({ weddingId, domain }: { weddingId: string; domain: string | null }) {
  const [state, formAction, pending] = useActionState(setCustomDomain.bind(null, weddingId), undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor={`domain-${weddingId}`}>
          Custom domain
        </label>
        <input
          id={`domain-${weddingId}`}
          name="domain"
          defaultValue={domain ?? ""}
          placeholder="amaraanddavid.com"
          className={`${inputClass} min-w-0 flex-1`}
        />
        <button
          type="submit"
          disabled={pending}
          className={buttonClass("inverse", "md")}
        >
          {pending ? "Saving…" : "Save domain"}
        </button>
      </div>
      <p className="text-xs text-ink/55">Leave empty and save to disconnect.</p>
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      {state?.message && <p className="text-xs text-success">{state.message}</p>}
    </form>
  );
}
