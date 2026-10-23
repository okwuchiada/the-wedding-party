"use client";

import { useActionState, useRef, useState } from "react";
import { ResultText } from "@/components/result-text";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSuccessToast } from "@/components/ui/toast";
import { createSupportRequest, type SupportFormState } from "@/lib/actions/support";
import { MAX_MESSAGE_LENGTH, MAX_SUBJECT_LENGTH, SUPPORT_TOPICS } from "@/lib/support";

/** Dashboard → Support: a couple raises a new request with the Vowly team. */
export default function SupportRequestForm({
  weddings,
  defaultWeddingId,
}: {
  weddings: { id: string; name: string }[];
  defaultWeddingId?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  // Bumped after a send so the selects reset along with the text fields.
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, pending] = useActionState(async (prev: SupportFormState, formData: FormData) => {
    const result = await createSupportRequest(prev, formData);
    if (result?.success) {
      formRef.current?.reset();
      setFormKey((k) => k + 1);
    }
    return result;
  }, undefined);
  useSuccessToast(state, "Request sent. We'll reply here and by email.");

  const initialWedding = defaultWeddingId ?? (weddings.length === 1 ? weddings[0].id : "");

  return (
    <form key={formKey} ref={formRef} action={formAction} className="flex flex-col gap-4 rounded-md border border-border bg-card p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="support-topic">What&apos;s it about?</Label>
          <FormSelect id="support-topic" name="topic" required options={SUPPORT_TOPICS.map((t) => ({ value: t.key, label: t.label }))} />
        </div>
        {weddings.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="support-wedding">Wedding</Label>
            <FormSelect
              id="support-wedding"
              name="weddingId"
              defaultValue={initialWedding}
              emptyLabel="Not about a wedding"
              options={weddings.map((w) => ({ value: w.id, label: w.name }))}
            />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="support-subject">Subject</Label>
        <Input id="support-subject" name="subject" required maxLength={MAX_SUBJECT_LENGTH} placeholder="e.g. A guest's contribution isn't showing" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="support-body">How can we help?</Label>
        <Textarea
          id="support-body"
          name="body"
          required
          rows={5}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="What happened, what you expected, and anything you've already tried."
          className="field-sizing-fixed bg-white py-2.5"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send request"}
        </Button>
        <ResultText error={state?.error} className="text-sm" />
      </div>
    </form>
  );
}
