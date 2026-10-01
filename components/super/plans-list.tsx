"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { UNLIMITED_GUESTS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import PlanForm, { type PlanView } from "./plan-form";

const NAIRA = { currency: "NGN", locale: "en-NG" };

function summary(plan: PlanView, themeCount: number) {
  const guests = plan.maxGuests >= UNLIMITED_GUESTS ? "Unlimited guests" : `${plan.maxGuests.toLocaleString()} guests`;
  const uploads = plan.maxUploads === null ? "no upload limit" : `${plan.maxUploads.toLocaleString()} uploads`;
  const months = plan.availabilityMonths === null ? "Permanent" : `${plan.availabilityMonths} months`;
  const themes = plan.themes.length === 0 || plan.themes.length === themeCount ? "all themes" : `${plan.themes.length} themes`;
  const weddings = `${plan.weddingCount} wedding${plan.weddingCount === 1 ? "" : "s"}`;
  return { first: `${guests} · ${uploads}`, second: `${months} · ${themes} · ${weddings}` };
}

function PlanRow({
  plan,
  themes,
  open,
  onToggle,
}: {
  plan: PlanView;
  themes: { key: string; name: string }[];
  open: boolean;
  onToggle: () => void;
}) {
  const { first, second } = summary(plan, themes.length);
  const formId = `plan-${plan.id}`;
  return (
    <li className={open ? "bg-paper/60" : ""}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:grid-cols-[10rem_7rem_minmax(0,1fr)_auto]">
        <div className="order-1">
          <p className="font-semibold">{plan.name}</p>
          <p className="text-xs text-foreground/55">
            {plan.popular ? "★ Most popular" : plan.active ? "On sale" : "Retired"}
          </p>
        </div>
        <p className="order-2 hidden font-semibold tabular-nums sm:block">{plan.priceKobo === 0 ? "Free" : formatMoney(plan.priceKobo, NAIRA)}</p>
        {/* On phones the details take their own line under the name. */}
        <div className="order-3 col-span-2 min-w-0 text-sm text-foreground/75 sm:col-span-1">
          <p className="font-semibold text-foreground sm:hidden">{plan.priceKobo === 0 ? "Free" : formatMoney(plan.priceKobo, NAIRA)}</p>
          <p className="sm:truncate">{first}</p>
          <p className="text-foreground/55 sm:truncate">{second}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={formId}
          className="order-2 py-1.5 text-sm sm:order-4"
        >
          {open ? "Close" : "Edit"}
        </Button>
      </div>
      {open && (
        <div id={formId} className="border-t border-mist bg-white px-4 py-5 sm:px-6">
          <PlanForm plan={plan} themes={themes} onCancel={onToggle} />
        </div>
      )}
    </li>
  );
}

export default function PlansList({ plans, themes }: { plans: PlanView[]; themes: { key: string; name: string }[] }) {
  // One plan open at a time ("new" for the create form).
  const [openId, setOpenId] = useState<string | null>(null);
  const [showRetired, setShowRetired] = useState(false);
  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id));
  const onSale = plans.filter((p) => p.active);
  const retired = plans.filter((p) => !p.active);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-foreground/70">
          One-time payments per wedding, in naira. New weddings start on the free plan. Retire a plan by turning off
          &ldquo;On sale&rdquo;; weddings already on it keep it.
        </p>
        <Button type="button" size="sm" onClick={() => toggle("new")} aria-expanded={openId === "new"} className="text-sm">
          New plan
        </Button>
      </div>

      {openId === "new" && (
        <section aria-label="New plan" className="rounded-md border border-mist bg-white px-4 py-5 sm:px-6">
          <h3 className="mb-4 font-(family-name:--m-display) text-xl font-bold tracking-tight">New plan</h3>
          <PlanForm themes={themes} onCancel={() => setOpenId(null)} />
        </section>
      )}

      <ul className="divide-y divide-mist overflow-hidden rounded-md border border-mist bg-white">
        {onSale.map((plan) => (
          <PlanRow key={plan.id} plan={plan} themes={themes} open={openId === plan.id} onToggle={() => toggle(plan.id)} />
        ))}
        {onSale.length === 0 && <li className="px-4 py-3.5 text-sm text-foreground/60">No plans on sale. Create one to start selling.</li>}
      </ul>

      {retired.length > 0 && (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="link"
            onClick={() => setShowRetired((v) => !v)}
            aria-expanded={showRetired}
            className="h-auto self-start px-0 py-0 text-sm font-normal whitespace-normal text-ink/70 underline decoration-ink/25 hover:text-ink"
          >
            {showRetired ? "Hide" : "Show"} retired plans:{" "}
            {retired.map((p) => `${p.name} (${p.weddingCount})`).join(", ")}
          </Button>
          {showRetired && (
            <ul className="divide-y divide-mist overflow-hidden rounded-md border border-mist bg-white">
              {retired.map((plan) => (
                <PlanRow key={plan.id} plan={plan} themes={themes} open={openId === plan.id} onToggle={() => toggle(plan.id)} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
