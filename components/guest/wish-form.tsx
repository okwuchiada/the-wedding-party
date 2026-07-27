"use client";

import { useActionState, useState } from "react";
import { submitWish } from "@/lib/actions/wishes";

const MAX_MESSAGE_LENGTH = 500;

export default function WishForm() {
  const [state, formAction, pending] = useActionState(submitWish, undefined);
  const [messageLength, setMessageLength] = useState(0);

  if (state?.success) {
    return (
      <div className="mx-auto max-w-xl bg-ivory p-4">
        <p className="mb-2 text-[10.5px] tracking-[.2em] text-burnt-orange uppercase">
          Your wish — awaiting approval
        </p>
        <p className="font-(family-name:--serif) text-base text-foreground italic">
          &ldquo;{state.message}&rdquo;
        </p>
        <p className="mt-2 text-xs text-foreground/60">— {state.guestName}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <form action={formAction} className="flex flex-col gap-3">
        <input
          placeholder="Your name"
          name="guestName"
          className="w-full border border-olive/20 bg-white px-4 py-3 text-sm outline-none"
        />
        <div>
          <textarea
            placeholder="Leave a wish for the couple…"
            name="message"
            maxLength={MAX_MESSAGE_LENGTH}
            rows={4}
            onChange={(e) => setMessageLength(e.target.value.length)}
            className="w-full resize-none border border-olive/20 bg-white px-4 py-3 text-sm outline-none"
          />
          <div className="mt-1 text-right text-[11px] text-foreground/50">
            {messageLength}/{MAX_MESSAGE_LENGTH}
          </div>
        </div>

        {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="self-start bg-burnt-orange px-6 py-2.5 text-xs font-medium text-ivory transition-colors hover:bg-burnt-orange-dark disabled:opacity-60"
        >
          {pending ? "Sending…" : "Leave a Wish"}
        </button>
      </form>
    </div>
  );
}
