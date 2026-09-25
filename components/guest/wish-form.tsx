"use client";

import { useActionState, useState } from "react";
import { submitWish } from "@/lib/actions/wishes";
import { useGuestSlug } from "./wedding-context";

const MAX_MESSAGE_LENGTH = 500;

export default function WishForm() {
  const slug = useGuestSlug();
  const [state, formAction, pending] = useActionState(submitWish.bind(null, slug), undefined);
  // Held in state so an error reply doesn't wipe what the guest typed (React resets uncontrolled fields after an action).
  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState("");

  if (state?.success) {
    return (
      <div className="mx-auto max-w-xl bg-ivory p-4">
        <p className="mb-2 text-[13px] tracking-[.2em] text-burnt-orange-dark uppercase">
          Your wish — awaiting approval
        </p>
        <p className="font-(family-name:--serif) text-base text-foreground italic">
          &ldquo;{state.message}&rdquo;
        </p>
        <p className="mt-2 text-[13px] text-foreground/65">— {state.guestName}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <form action={formAction} className="flex flex-col gap-5">
        <div>
          <label htmlFor="wish-name" className="guest-label">
            Your name
          </label>
          <input id="wish-name" name="guestName" autoComplete="name" required value={guestName} onChange={(e) => setGuestName(e.target.value)} className="guest-input" />
        </div>
        <div>
          <label htmlFor="wish-message" className="guest-label">
            Your wish
          </label>
          <textarea
            id="wish-message"
            name="message"
            required
            aria-describedby="wish-count"
            maxLength={MAX_MESSAGE_LENGTH}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="guest-input resize-none"
          />
          <div id="wish-count" className="mt-1 text-right text-[13px] text-foreground/60">
            {message.length}/{MAX_MESSAGE_LENGTH}
          </div>
        </div>

        {state?.error && (
          <p role="alert" className="text-[15px] text-burnt-orange-dark">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="guest-btn w-full sm:w-auto sm:self-start"
        >
          {pending ? "Sending…" : "Leave a wish"}
        </button>
      </form>
    </div>
  );
}
