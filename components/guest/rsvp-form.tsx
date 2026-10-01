"use client";

import { useActionState, useState } from "react";
import { submitRsvp } from "@/lib/actions/rsvp";
import { MAX_PARTY_SIZE } from "@/lib/rsvp-rules";
import { useGuestSlug } from "./wedding-context";

export default function RsvpForm() {
  const slug = useGuestSlug();
  const [state, formAction, pending] = useActionState(submitRsvp.bind(null, slug), undefined);
  const [attending, setAttending] = useState<"yes" | "no" | "">("");
  const [party, setParty] = useState(1);
  // Held in state: React resets a form's uncontrolled fields after every action,
  // including one that returns an error, which would wipe what the guest typed.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  if (state?.success) {
    return (
      <div className="mx-auto max-w-xl bg-ivory p-6 text-center">
        <p className="mb-2 text-[13px] tracking-[.2em] text-burnt-orange-dark uppercase">
          Thank you, {state.guestName}
        </p>
        <p className="font-(family-name:--serif) text-xl text-foreground italic">
          {state.attending
            ? "We can't wait to celebrate with you."
            : "We'll miss you, but thank you for letting us know."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <form action={formAction} className="flex flex-col gap-5">
        {/* Honeypot. The name and label are deliberately meaningless so browser and
            password-manager autofill leave it empty for real guests. */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
          <label htmlFor="hp_rsvp_x7">Leave this empty</label>
          <input
            type="text"
            id="hp_rsvp_x7"
            name="hp_rsvp_x7"
            tabIndex={-1}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-bwignore
            data-form-type="other"
          />
        </div>

        <div>
          <label htmlFor="rsvp-name" className="guest-label">
            Your name
          </label>
          <input id="rsvp-name" name="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} className="guest-input" />
        </div>

        <fieldset>
          <legend className="guest-label">Will you attend?</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="guest-choice">
              <input
                type="radio"
                name="attending"
                value="yes"
                checked={attending === "yes"}
                onChange={() => setAttending("yes")}
                className="sr-only"
              />
              Yes, I&apos;ll be there
            </label>
            <label className="guest-choice">
              <input
                type="radio"
                name="attending"
                value="no"
                checked={attending === "no"}
                onChange={() => setAttending("no")}
                className="sr-only"
              />
              Sorry, I can&apos;t
            </label>
          </div>
        </fieldset>

        {attending === "yes" && (
          <div>
            <label htmlFor="rsvp-party" className="guest-label">
              How many of you, including you?
            </label>
            <div className="flex items-stretch border border-foreground/30 bg-white">
              <button
                type="button"
                aria-label="One fewer"
                disabled={party <= 1}
                onClick={() => setParty((n) => Math.max(1, n - 1))}
                className="min-h-11 min-w-12 text-xl disabled:opacity-40"
              >
                −
              </button>
              <input
                id="rsvp-party"
                name="partySize"
                inputMode="numeric"
                value={party}
                onChange={(e) => setParty(Math.min(MAX_PARTY_SIZE, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))}
                className="w-full border-x border-foreground/20 text-center text-base"
              />
              <button
                type="button"
                aria-label="One more"
                disabled={party >= MAX_PARTY_SIZE}
                onClick={() => setParty((n) => Math.min(MAX_PARTY_SIZE, n + 1))}
                className="min-h-11 min-w-12 text-xl disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="rsvp-email" className="guest-label">
            Email <span className="font-normal tracking-normal normal-case opacity-70">(optional, for your confirmation)</span>
          </label>
          <input id="rsvp-email" type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="guest-input" />
        </div>

        <div>
          <label htmlFor="rsvp-message" className="guest-label">
            Message <span className="font-normal tracking-normal normal-case opacity-70">(optional)</span>
          </label>
          <textarea id="rsvp-message" name="message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="guest-input resize-none" />
        </div>

        {state?.error && (
          <p role="alert" className="text-[15px] text-burnt-orange-dark">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="guest-btn w-full">
          {pending ? "Sending…" : "Send RSVP"}
        </button>
      </form>
    </div>
  );
}
