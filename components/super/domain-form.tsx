"use client";

import { useActionState } from "react";
import { setCustomDomain } from "@/lib/actions/super";

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
          className="min-w-0 flex-1 border border-(--m-mist) bg-white px-3 py-2 text-sm outline-none focus:border-(--m-ink)/50"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-(--m-ink) px-4 py-2 text-sm font-semibold text-(--m-paper) hover:bg-(--m-emerald) disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save domain"}
        </button>
      </div>
      <p className="text-xs text-(--m-ink)/55">Leave empty and save to disconnect.</p>
      {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}
      {state?.message && <p className="text-xs text-olive">{state.message}</p>}
    </form>
  );
}
