"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setCustomDomain } from "@/lib/actions/super";
import { ResultText } from "@/components/result-text";

export default function DomainForm({ weddingId, domain }: { weddingId: string; domain: string | null }) {
  const [state, formAction, pending] = useActionState(setCustomDomain.bind(null, weddingId), undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Label className="sr-only" htmlFor={`domain-${weddingId}`}>
          Custom domain
        </Label>
        <Input
          id={`domain-${weddingId}`}
          name="domain"
          defaultValue={domain ?? ""}
          placeholder="amaraanddavid.com"
          className="w-auto min-w-0 flex-1"
        />
        <Button type="submit" variant="ink" size="sm" disabled={pending} className="text-sm">
          {pending ? "Saving…" : "Save domain"}
        </Button>
      </div>
      <p className="text-xs text-ink/55">Leave empty and save to disconnect.</p>
      <ResultText error={state?.error} message={state?.message} />
    </form>
  );
}
