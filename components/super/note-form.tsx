"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addSupportNote } from "@/lib/actions/super";
import { ResultText } from "@/components/result-text";

export default function NoteForm({ weddingId }: { weddingId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: Awaited<ReturnType<typeof addSupportNote>>, formData: FormData) => {
      const result = await addSupportNote(weddingId, prev, formData);
      if (result?.success) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="note-body">Add a note</Label>
      <Textarea
        id="note-body"
        name="body"
        required
        rows={3}
        maxLength={2000}
        placeholder="What happened, what you did, what's next"
        className="field-sizing-fixed py-2.5"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending} className="text-sm">
          {pending ? "Saving…" : "Save note"}
        </Button>
        <ResultText error={state?.error} className="text-sm" />
      </div>
    </form>
  );
}
