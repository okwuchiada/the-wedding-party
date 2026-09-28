"use client";

import Image from "next/image";
import { canOptimizeImage } from "@/lib/image-src";
import { useState } from "react";
import type { BankDetailsView } from "@/lib/types";
import type { RegistryItemWithContributions } from "@/lib/types";
import { submitContribution } from "@/lib/actions/contributions";
import CopyRow from "./copy-row";
import { currencySymbol, formatAmount, formatMoney, minContribution } from "@/lib/money";
import { useGuestMoney, useGuestSlug } from "./wedding-context";

function sumContributions(contributions: { amountCents: number }[]) {
  return contributions.reduce((sum, c) => sum + c.amountCents, 0);
}

function ProgressBar({ raised, goal }: { raised: number; goal: number }) {
  const money = useGuestMoney();
  const pct = Math.min(100, Math.round((raised / goal) * 100));
  const done = pct >= 100;

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex justify-between text-[11.5px] tracking-[.04em] text-foreground/70">
        <span>
          {done
            ? "Fully funded — thank you"
            : `${formatMoney(raised, money)} of ${formatMoney(goal, money)}`}
        </span>
        <span
          className={`font-medium ${done ? "text-burnt-orange-dark" : "text-burnt-orange"}`}
        >
          {pct}%
        </span>
      </div>
      <div className="relative h-1 bg-olive/15">
        <div
          style={{ width: `${pct}%` }}
          className={`absolute inset-y-0 left-0 transition-[width] duration-600 ease-out ${
            done ? "bg-burnt-orange-dark" : "bg-burnt-orange"
          }`}
        />
      </div>
    </div>
  );
}

type Action = "BUY" | "CHIPIN";


export default function GiftCard({
  gift,
  bankDetails,
  variant = "card",
}: {
  gift: RegistryItemWithContributions;
  bankDetails: BankDetailsView;
  variant?: "card" | "row" | "bold";
}) {
  const raised = sumContributions(gift.contributions);
  const remaining = Math.max(0, gift.priceCents - raised);
  const funded = raised >= gift.priceCents;
  const alreadyContributing = raised > 0 && !funded;
  const money = useGuestMoney();
  const minChipInCents = Math.min(minContribution(money.currency), remaining);

  const slug = useGuestSlug();
  const [action, setAction] = useState<Action | null>(null);
  const [guestName, setGuestName] = useState("");
  const [amountCents, setAmountCents] = useState(
    Math.max(minChipInCents, Math.min(remaining, 500_000_00)),
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const claimed = !!gift.claimedBy;

  const submitContributionOf = async (amount: number) => {
    if (!guestName.trim()) {
      setError("Please enter your name");
      return;
    }
    setError("");
    setPending(true);

    const formData = new FormData();
    formData.set("registryItemId", gift.id);
    formData.set("guestName", guestName);
    formData.set("amountCents", String(amount));

    const result = await submitContribution(slug, undefined, formData);
    setPending(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setSubmitted(true);
    }
  };

  const handleContribution = () => {
    if (amountCents < minChipInCents) {
      setError(`Minimum contribution is ${formatMoney(minChipInCents, money)}`);
      return;
    }
    submitContributionOf(amountCents);
  };
  const handleBuyTransfer = () => submitContributionOf(gift.priceCents);

  return (
    <article
      className={
        variant === "row"
          ? "grid grid-cols-[6rem_1fr] border border-olive/15 bg-white sm:grid-cols-[10rem_1fr]"
          : variant === "bold"
            ? "flex flex-col border-t-8 border-burnt-orange bg-white"
            : "flex flex-col bg-white shadow-[0_18px_40px_-20px_rgb(var(--ink)/0.45)]"
      }
    >
      <div className={`relative w-full overflow-hidden bg-olive/10 ${variant === "row" ? "h-full min-h-24" : "h-45"}`}>
        <Image
          src={gift.image} unoptimized={!canOptimizeImage(gift.image)}
          alt={gift.name}
          fill
          sizes={variant === "row" ? "10rem" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
          className="object-cover"
          loading="eager"
        />
      </div>

      <div className="flex flex-1 flex-col p-5.5">
        <h3 className="font-(family-name:--serif) text-2xl text-foreground">
          {gift.name}
        </h3>
        <div className="text-sm font-medium text-burnt-orange">
          {formatMoney(gift.priceCents, money)}
        </div>

        <ProgressBar raised={raised} goal={gift.priceCents} />

        {action === "CHIPIN" && (
          <div className="mt-4.5 bg-ivory p-4">
            {submitted ? (
              <div>
                <p className="text-sm text-foreground/80">
                  Payment sent — waiting for the couple to confirm.
                </p>
                <p className="mt-2 font-(family-name:--serif) text-sm text-burnt-orange italic">
                  Thank you
                </p>
              </div>
            ) : (
              <>
                <div className="mb-2 text-[10.5px] tracking-[.2em] text-burnt-orange uppercase">
                  Transfer to the couple
                </div>
                <p className="mb-3 text-[12.5px] leading-relaxed text-foreground/70">
                  Contribute any amount toward this gift — other guests may
                  be chipping in too. Transfer below with your bank app,
                  then confirm here.
                </p>
                <CopyRow label="Account name" value={bankDetails.name} />
                <CopyRow label="Bank" value={bankDetails.bank} />
                <CopyRow label="Account no." value={bankDetails.account} />
                {/* <CopyRow label="Routing" value={bankDetails.routing} /> */}
                <CopyRow label="Reference" value={gift.name} />
                <p className="mt-1.5 text-[10.5px] text-foreground/50">
                  Use this exact reference on your transfer — it&apos;s how
                  we match your payment to this gift.
                </p>

                <input
                  placeholder="Your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="mt-3 w-full border border-olive/20 bg-white px-3 py-2.5 text-sm outline-none"
                />

                <div className="mt-2.5 flex items-center gap-2.5">
                  <label className="relative flex-1">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 font-(family-name:--serif) text-lg text-burnt-orange">
                      {currencySymbol(money)}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatAmount(Math.ceil(amountCents / 100), money)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^0-9]/g, "");
                        const naira = digits ? Number(digits) : 0;
                        const capped = Math.min(
                          naira,
                          Math.max(1, Math.ceil(remaining / 100)),
                        );
                        setAmountCents(capped * 100);
                      }}
                      // Leave room for wider symbols like "KSh" or "CA$".
                      style={{ paddingLeft: `${1 + currencySymbol(money).length * 0.65}rem` }}
                      className="w-full border border-olive/20 bg-white py-2.5 pr-3 text-[15px] text-foreground outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleContribution}
                    disabled={pending}
                    className=" bg-burnt-orange px-4 py-2.5 text-xs font-medium text-ivory transition-colors hover:bg-burnt-orange-dark disabled:opacity-60"
                  >
                    {pending ? "…" : "Confirm Transfer"}
                  </button>
                </div>
                <div className="mt-1.5 text-[10.5px] text-foreground/50">
                  Minimum {formatMoney(minChipInCents, money)}
                </div>
                {error && (
                  <div className="mt-2 text-xs text-burnt-orange">{error}</div>
                )}
              </>
            )}
          </div>
        )}

        {action === "BUY" && (
          <div className="mt-4.5 bg-ivory p-4">
            {submitted ? (
              <div>
                <p className="text-sm text-foreground/80">
                  Payment sent — waiting for the couple to confirm.
                </p>
                <p className="mt-2 font-(family-name:--serif) text-sm text-burnt-orange italic">
                  Thank you
                </p>
              </div>
            ) : (
              <>
                <div className="mb-2 text-[10.5px] tracking-[.2em] text-burnt-orange uppercase">
                  Transfer to the couple
                </div>
                <CopyRow label="Account name" value={bankDetails.name} />
                <CopyRow label="Bank" value={bankDetails.bank} />
                <CopyRow label="Account no." value={bankDetails.account} />
                {/* <CopyRow label="Routing" value={bankDetails.routing} /> */}
                <CopyRow label="Reference" value={gift.name} />
                <p className="mt-1.5 text-[10.5px] text-foreground/50">
                  Use this exact reference on your transfer — it&apos;s how
                  we match your payment to this gift.
                </p>
                <div className="flex items-baseline justify-between gap-3 border-b border-olive/20 py-2">
                  <span className="text-[10.5px] uppercase tracking-[.16em] text-foreground/55">
                    Amount
                  </span>
                  <span className="text-[13.5px] font-medium text-burnt-orange">
                    {formatMoney(gift.priceCents, money)}
                  </span>
                </div>

                <input
                  placeholder="Your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="mt-3 w-full border border-olive/20 bg-white px-3 py-2.5 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={handleBuyTransfer}
                  disabled={pending}
                  className="mt-2.5 w-full bg-burnt-orange px-4 py-2.5 text-xs font-medium text-ivory transition-colors hover:bg-burnt-orange-dark disabled:opacity-60"
                >
                  {pending ? "…" : "Confirm Transfer"}
                </button>
                {error && (
                  <div className="mt-2 text-xs text-burnt-orange">{error}</div>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-5">
          {funded ? (
            <button
              type="button"
              disabled
              className="cursor-default  border border-olive/30 px-4 py-2.5 text-center text-xs font-medium text-foreground/60"
            >
              ✓ Fully Funded — thank you
            </button>
          ) : claimed ? (
            <button
              type="button"
              disabled
              className="cursor-default border border-olive/30 px-4 py-2.5 text-center text-xs font-medium text-foreground/60"
            >
              ✓ Claimed by {gift.claimedBy}
            </button>
          ) : action === "CHIPIN" || action === "BUY" ? (
            <button
              type="button"
              onClick={() => setAction(null)}
              className="border border-olive/30 px-4 py-2.5 text-center text-xs font-medium text-foreground transition-colors hover:border-burnt-orange hover:text-burnt-orange"
            >
              Close
            </button>
          ) : alreadyContributing ? (
            <button
              type="button"
              onClick={() => setAction("CHIPIN")}
              className="bg-burnt-orange px-4 py-2.5 text-center text-xs font-medium text-ivory transition-colors hover:bg-burnt-orange-dark"
            >
              Contribute More
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gift.externalUrl ? (
                <a
                  href={gift.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-burnt-orange px-2 py-2.5 text-center text-[11px] font-medium text-ivory transition-colors hover:bg-burnt-orange-dark"
                >
                  Buy
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setAction("BUY")}
                  className="bg-burnt-orange px-2 py-2.5 text-center text-[11px] font-medium text-ivory transition-colors hover:bg-burnt-orange-dark"
                >
                  Buy
                </button>
              )}
              <button
                type="button"
                onClick={() => setAction("CHIPIN")}
                className="border border-olive/30 px-2 py-2.5 text-center text-[11px] font-medium text-foreground transition-colors hover:border-burnt-orange hover:text-burnt-orange"
              >
                Contribute
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
