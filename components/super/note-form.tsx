"use client";

import { useActionState, useRef } from "react";
import { addSupportNote } from "@/lib/actions/super";

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
        className="border border-(--m-mist) bg-white px-3 py-2.5 text-sm"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-(--m-gold) px-5 py-2 text-sm font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper) disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save note"}
        </button>
        {state?.error && <span className="text-sm text-(--m-coral-deep)">{state.error}</span>}
      </div>
    </form>
  );
}
