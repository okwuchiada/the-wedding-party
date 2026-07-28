"use client";

import { useActionState, useState } from "react";
import { submitRsvp } from "@/lib/actions/rsvp";

export default function RsvpForm() {
  const [state, formAction, pending] = useActionState(submitRsvp, undefined);
  const [attending, setAttending] = useState<"yes" | "no" | "">("");

  if (state?.success) {
    return (
      <div className="mx-auto max-w-xl bg-ivory p-6 text-center">
        <p className="mb-2 text-[10.5px] tracking-[.2em] text-burnt-orange uppercase">
          Thank you, {state.guestName}
        </p>
        <p className="font-(family-name:--serif) text-lg text-foreground italic">
          {state.attending
            ? "We can't wait to celebrate with you!"
            : "We'll miss you, but thank you for letting us know."}
        </p>
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

        <div className="grid grid-cols-2 gap-3">
          <label
            className={`flex cursor-pointer items-center justify-center border px-4 py-3 text-center text-sm transition-colors ${
              attending === "yes"
                ? "border-burnt-orange text-burnt-orange"
                : "border-olive/20 text-foreground"
            }`}
          >
            <input
              type="radio"
              name="attending"
              value="yes"
              checked={attending === "yes"}
              onChange={() => setAttending("yes")}
              className="sr-only"
            />
            Joyfully Accept
          </label>
          <label
            className={`flex cursor-pointer items-center justify-center border px-4 py-3 text-center text-sm transition-colors ${
              attending === "no"
                ? "border-burnt-orange text-burnt-orange"
                : "border-olive/20 text-foreground"
            }`}
          >
            <input
              type="radio"
              name="attending"
              value="no"
              checked={attending === "no"}
              onChange={() => setAttending("no")}
              className="sr-only"
            />
            Regretfully Decline
          </label>
        </div>

        <textarea
          placeholder="Anything else you'd like us to know? (optional)"
          name="message"
          rows={3}
          className="w-full resize-none border border-olive/20 bg-white px-4 py-3 text-sm outline-none"
        />

        {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="self-start bg-burnt-orange px-6 py-2.5 text-xs font-medium text-ivory transition-colors hover:bg-burnt-orange-dark disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send RSVP"}
        </button>
      </form>
    </div>
  );
}
