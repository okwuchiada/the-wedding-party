"use client";

import Image from "next/image";
import { canOptimizeImage } from "@/lib/image-src";
import { useState } from "react";
import type { BankDetailsView } from "@/lib/types";
import type { RegistryItemWithContributions } from "@/lib/types";
import TransferPanel from "./transfer-panel";
import { currencySymbol, formatAmount, formatMoney, minContribution } from "@/lib/money";
import { useGuestMoney } from "./wedding-context";

function sumContributions(contributions: { amountCents: number }[]) {
  return contributions.reduce((sum, c) => sum + c.amountCents, 0);
}

function ProgressBar({ raised, goal }: { raised: number; goal: number }) {
  const money = useGuestMoney();
  const pct = Math.min(100, Math.round((raised / goal) * 100));
  const done = pct >= 100;

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex justify-between text-[13px] tracking-[.04em] text-foreground/70">
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

  const [action, setAction] = useState<Action | null>(null);
  const [amountCents, setAmountCents] = useState(
    Math.max(minChipInCents, Math.min(remaining, 500_000_00)),
  );
  const [submitted, setSubmitted] = useState(false);

  const claimed = !!gift.claimedBy;

  const checkAmount = () =>
    amountCents < minChipInCents ? `The smallest amount is ${formatMoney(minChipInCents, money)}` : null;

  const thanks = (
    <div>
      <p className="text-[15px] text-foreground/80">Thank you. The couple will confirm once the money arrives.</p>
    </div>
  );

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
          <div className="mt-4.5 flex flex-col gap-4 bg-ivory p-4">
            {submitted ? (
              thanks
            ) : (
              <>
                <div>
                  <label htmlFor={`gift-amount-${gift.id}`} className="guest-label">
                    How much would you like to give?
                  </label>
                  <span className="relative block">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 font-(family-name:--serif) text-lg text-burnt-orange">
                      {currencySymbol(money)}
                    </span>
                    <input
                      id={`gift-amount-${gift.id}`}
                      type="text"
                      inputMode="numeric"
                      aria-describedby={`gift-amount-hint-${gift.id}`}
                      value={formatAmount(Math.ceil(amountCents / 100), money)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^0-9]/g, "");
                        const major = digits ? Number(digits) : 0;
                        setAmountCents(Math.min(major, Math.max(1, Math.ceil(remaining / 100))) * 100);
                      }}
                      // Leave room for wider symbols like "KSh" or "CA$".
                      style={{ paddingLeft: `${1 + currencySymbol(money).length * 0.65}rem` }}
                      className="guest-input pr-3"
                    />
                  </span>
                  <p id={`gift-amount-hint-${gift.id}`} className="mt-1.5 text-[13px] text-foreground/65">
                    At least {formatMoney(minChipInCents, money)}. Other guests may be chipping in too.
                  </p>
                </div>
                <TransferPanel gift={gift} bankDetails={bankDetails} amountCents={amountCents} validate={checkAmount} onSent={() => setSubmitted(true)} />
              </>
            )}
          </div>
        )}

        {action === "BUY" && (
          <div className="mt-4.5 bg-ivory p-4">
            {submitted ? thanks : <TransferPanel gift={gift} bankDetails={bankDetails} amountCents={gift.priceCents} onSent={() => setSubmitted(true)} />}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-5">
          {funded ? (
            <button
              type="button"
              disabled
              className="cursor-default  border border-olive/30 min-h-11 px-4 py-2.5 text-center text-sm font-medium text-foreground/60"
            >
              ✓ Fully Funded — thank you
            </button>
          ) : claimed ? (
            <button
              type="button"
              disabled
              className="cursor-default border border-olive/30 min-h-11 px-4 py-2.5 text-center text-sm font-medium text-foreground/60"
            >
              ✓ Claimed by {gift.claimedBy}
            </button>
          ) : action === "CHIPIN" || action === "BUY" ? (
            <button
              type="button"
              onClick={() => setAction(null)}
              className="border border-olive/30 min-h-11 px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:border-burnt-orange hover:text-burnt-orange"
            >
              Close
            </button>
          ) : alreadyContributing ? (
            <button
              type="button"
              onClick={() => setAction("CHIPIN")}
              className="bg-burnt-orange min-h-11 px-4 py-2.5 text-center text-sm font-medium text-ivory transition-colors hover:bg-burnt-orange-dark"
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
                  className="bg-burnt-orange min-h-11 px-2 py-2.5 text-center text-sm font-medium text-ivory transition-colors hover:bg-burnt-orange-dark"
                >
                  Buy
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setAction("BUY")}
                  className="bg-burnt-orange min-h-11 px-2 py-2.5 text-center text-sm font-medium text-ivory transition-colors hover:bg-burnt-orange-dark"
                >
                  Buy
                </button>
              )}
              <button
                type="button"
                onClick={() => setAction("CHIPIN")}
                className="border border-olive/30 min-h-11 px-2 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:border-burnt-orange hover:text-burnt-orange"
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
