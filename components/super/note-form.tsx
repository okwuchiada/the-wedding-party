"use client";

import { useActionState, useRef } from "react";
import { addSupportNote } from "@/lib/actions/super";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";

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
      <label htmlFor="note-body" className="text-sm font-medium">
        Add a note
      </label>
      <textarea
        id="note-body"
        name="body"
        required
        rows={3}
        maxLength={2000}
        placeholder="What happened, what you did, what's next"
        className={inputClass}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass("primary", "md")}
        >
          {pending ? "Saving…" : "Save note"}
        </button>
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}
