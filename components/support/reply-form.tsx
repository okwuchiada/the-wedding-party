"use client";

import { useActionState, useId, useRef } from "react";
import { ResultText } from "@/components/result-text";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSuccessToast } from "@/components/ui/toast";
import type { SupportFormState } from "@/lib/actions/support";
import { MAX_MESSAGE_LENGTH } from "@/lib/support";

/** Adds a message to a support thread. Staff also get "mark resolved" alongside their reply. */
export default function SupportReplyForm({
  action,
  label = "Reply",
  placeholder,
  allowResolve = false,
  note,
}: {
  action: (prev: SupportFormState, formData: FormData) => Promise<SupportFormState>;
  label?: string;
  placeholder?: string;
  allowResolve?: boolean;
  note?: string;
}) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prev: SupportFormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result?.success) formRef.current?.reset();
    return result;
  }, undefined);
  useSuccessToast(state, "Message sent");

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <Label htmlFor={`${id}-body`}>{label}</Label>
      <Textarea
        id={`${id}-body`}
        name="body"
        required
        rows={3}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder={placeholder}
        className="field-sizing-fixed bg-white py-2.5"
      />
      {note && <p className="text-xs text-ink/60">{note}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={pending} className="text-sm">
          {pending ? "Sending…" : "Send"}
        </Button>
        {allowResolve && (
          <label className="flex items-center gap-2 text-sm text-ink/75">
            <input type="checkbox" name="resolve" className="size-4 accent-emerald" />
            Mark resolved
          </label>
        )}
        <ResultText error={state?.error} className="text-sm" />
      </div>
    </form>
  );
}
