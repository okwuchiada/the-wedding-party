"use client";

import { useState } from "react";
import { submitContribution } from "@/lib/actions/contributions";
import { formatMoney } from "@/lib/money";
import { forgetReference, stickyReference } from "@/lib/sticky-reference";
import { transferReference } from "@/lib/transfer-reference";
import type { BankDetailsView, RegistryItemWithContributions } from "@/lib/types";
import CopyRow from "./copy-row";
import { useGuestMoney, useGuestSlug } from "./wedding-context";

/** sessionStorage, or a stand-in that refuses (some browsers throw just for reading it). */
function session(): Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  try {
    return window.sessionStorage;
  } catch {
    const refuse = () => {
      throw new Error("storage unavailable");
    };
    return { getItem: refuse, setItem: refuse, removeItem: refuse };
  }
}

/**
 * How a guest gives towards a gift: send the money from their own bank app with
 * a reference made for them, then tell the couple it's from them. The reference
 * is kept for the browser session, so it stays the same while they switch apps.
 */
export default function TransferPanel({
  gift,
  bankDetails,
  amountCents,
  validate,
  onSent,
}: {
  gift: RegistryItemWithContributions;
  bankDetails: BankDetailsView;
  amountCents: number;
  /** A problem with the amount, checked before sending (e.g. below the minimum). */
  validate?: () => string | null;
  onSent: () => void;
}) {
  const money = useGuestMoney();
  const slug = useGuestSlug();
  const refKey = `${slug}:${gift.id}`;
  // The panel only renders after a tap, so sessionStorage is available here.
  const [reference] = useState(() => stickyReference(session(), refKey, () => transferReference(gift.name)));
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const nameId = `gift-name-${gift.id}`;

  const send = async () => {
    const problem = validate?.() ?? (guestName.trim() ? null : "Please enter your name");
    if (problem) return setError(problem);
    setError("");
    setPending(true);
    const formData = new FormData();
    formData.set("registryItemId", gift.id);
    formData.set("guestName", guestName);
    formData.set("amountCents", String(amountCents));
    formData.set("reference", reference);
    try {
      const result = await submitContribution(slug, undefined, formData);
      if (result?.error) return setError(result.error);
      forgetReference(session(), refKey);
      onSent();
    } catch {
      setError("That didn't send. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[15px] font-semibold text-foreground">1. Send {formatMoney(amountCents, money)} from your bank app</p>
        <div className="mt-1">
          <CopyRow label="Bank" value={bankDetails.bank} />
          <CopyRow label="Account no." value={bankDetails.account} />
          <CopyRow label="Account name" value={bankDetails.name} />
          <CopyRow label="Reference" value={reference} />
        </div>
        <p className="mt-2 text-[13px] text-foreground/70">Use this reference so the couple knows the money is from you.</p>
      </div>

      <div>
        <p className="text-[15px] font-semibold text-foreground">2. Tell the couple it&apos;s from you</p>
        <label htmlFor={nameId} className="guest-label mt-2">
          Your name
        </label>
        <input id={nameId} autoComplete="name" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="guest-input" />
      </div>

      {error && (
        <p role="alert" className="text-[15px] text-burnt-orange-dark">
          {error}
        </p>
      )}

      <button type="button" onClick={send} disabled={pending} className="guest-btn w-full">
        {pending ? "Sending…" : "I've sent the transfer"}
      </button>
    </div>
  );
}
