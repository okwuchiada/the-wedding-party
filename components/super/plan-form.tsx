"use client";

import { startTransition, useActionState, useState } from "react";
import { savePlan } from "@/lib/actions/super";
import { FEATURE_LABELS, UNLIMITED_GUESTS, type PlanFeature } from "@/lib/plans";
import { buttonClass } from "@/components/ui/button";

export type PlanView = {
  id: string;
  key: string;
  name: string;
  tagline: string | null;
  priceKobo: number;
  maxGuests: number;
  maxUploads: number | null;
  availabilityMonths: number | null;
  themes: string[];
  sortOrder: number;
  active: boolean;
  popular: boolean;
  highlights: string[];
  limitations: string[];
  features: Partial<Record<PlanFeature, boolean>>;
  weddingCount: number;
};

const field = "w-full border border-line bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus:border-ink/50 disabled:bg-paper disabled:text-muted";
const label = "flex flex-col gap-1 text-xs text-muted";
const check = "flex items-center gap-2 text-sm text-ink";

/** One labelled group of settings: the label on the left, the fields on the right. */
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 border-t border-line py-4 first-of-type:border-t-0 first-of-type:pt-0 sm:grid-cols-[9rem_1fr] sm:gap-6">
      <div>
        <h4 className="text-sm font-semibold">{title}</h4>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/** A number with a tick box for its "no limit" value (unlimited guests, no upload cap, permanent). */
function LimitField({
  name,
  title,
  value,
  noLimitLabel,
  noLimitValue,
  min,
}: {
  name: string;
  title: string;
  value: number | null;
  noLimitLabel: string;
  /** What to submit when the box is ticked: "" (stored as null) or a sentinel number. */
  noLimitValue: string;
  min: number;
}) {
  const isNoLimit = value === null || String(value) === noLimitValue;
  const [noLimit, setNoLimit] = useState(isNoLimit);
  const [number, setNumber] = useState(isNoLimit ? "" : String(value));
  return (
    <div className={label}>
      {title}
      <input
        type="number"
        min={min}
        aria-label={title}
        value={noLimit ? "" : number}
        onChange={(e) => setNumber(e.target.value)}
        disabled={noLimit}
        required={!noLimit}
        className={field}
      />
      <input type="hidden" name={name} value={noLimit ? noLimitValue : number} />
      <label className="flex items-center gap-1.5 text-xs text-muted">
        <input type="checkbox" checked={noLimit} onChange={(e) => setNoLimit(e.target.checked)} />
        {noLimitLabel}
      </label>
    </div>
  );
}

/** The settings for one plan (or a new one), grouped into short sections. */
export default function PlanForm({
  plan,
  themes,
  onCancel,
}: {
  plan?: PlanView;
  themes: { key: string; name: string }[];
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState(savePlan, undefined);
  const [allThemes, setAllThemes] = useState(!plan || plan.themes.length === 0);

  return (
    <form
      // Submitted by hand rather than via `action`, so React doesn't reset the form after saving:
      // a reset would put the tick boxes back to their first values while their state stays as edited.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="flex flex-col"
    >
      {plan && <input type="hidden" name="id" value={plan.id} />}

      <Section title="Basics">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className={label}>
            Name
            <input name="name" defaultValue={plan?.name} required className={field} />
          </label>
          <label className={label}>
            Price (₦)
            <input name="priceNaira" type="number" min={0} step="0.01" defaultValue={plan ? plan.priceKobo / 100 : ""} required className={field} />
          </label>
          <label className={label}>
            Key
            <input name="key" defaultValue={plan?.key} required className={field} />
          </label>
          <label className={label}>
            Order
            <input name="sortOrder" type="number" defaultValue={plan?.sortOrder ?? 0} className={field} />
          </label>
          <label className={`${label} col-span-2 sm:col-span-4`}>
            Tagline
            <input name="tagline" defaultValue={plan?.tagline ?? ""} maxLength={120} className={field} />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <label className={check}>
            <input type="checkbox" name="active" defaultChecked={plan?.active ?? true} />
            On sale
          </label>
          <label className={check}>
            <input type="checkbox" name="popular" defaultChecked={plan?.popular ?? false} />
            Most popular
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">A price of 0 makes this the free plan new weddings start on.</p>
      </Section>

      <Section title="Limits" hint="Months online count from the wedding date.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <LimitField
            name="maxGuests"
            title="Guests"
            value={plan?.maxGuests ?? null}
            noLimitLabel="Unlimited"
            noLimitValue={String(UNLIMITED_GUESTS)}
            min={1}
          />
          <LimitField name="maxUploads" title="Guest uploads" value={plan?.maxUploads ?? null} noLimitLabel="No limit" noLimitValue="" min={0} />
          <LimitField
            name="availabilityMonths"
            title="Months online"
            value={plan ? plan.availabilityMonths : null}
            noLimitLabel="Permanent"
            noLimitValue=""
            min={1}
          />
        </div>
      </Section>

      <Section title="Unlocks">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(Object.keys(FEATURE_LABELS) as PlanFeature[]).map((f) => (
            <label key={f} className={check}>
              <input type="checkbox" name={`feature_${f}`} defaultChecked={plan?.features[f] === true} />
              {FEATURE_LABELS[f]}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Themes">
        <label className={check}>
          <input type="checkbox" checked={allThemes} onChange={(e) => setAllThemes(e.target.checked)} />
          Every theme
        </label>
        {/* Unticked themes aren't submitted, so "every theme" simply sends none. */}
        {!allThemes && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <p className="col-span-2 text-xs text-muted sm:col-span-3">Tick the themes this plan includes. None ticked means every theme.</p>
            {themes.map((t) => (
              <label key={t.key} className={check}>
                <input type="checkbox" name="themes" value={t.key} defaultChecked={plan?.themes.includes(t.key) ?? false} />
                {t.name}
              </label>
            ))}
          </div>
        )}
      </Section>

      <Section title="Pricing page text" hint="What couples read. Keep it in step with the limits and unlocks above.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={label}>
            Features, one per line
            <textarea name="highlights" rows={6} defaultValue={plan?.highlights.join("\n")} className={field} />
          </label>
          <label className={label}>
            Limits, one per line
            <textarea name="limitations" rows={6} defaultValue={plan?.limitations.join("\n")} className={field} />
          </label>
        </div>
      </Section>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass("inverse", "md")}
        >
          {pending ? "Saving…" : plan ? "Save plan" : "Create plan"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={buttonClass("text", "md")}>
            Cancel
          </button>
        )}
        {plan && plan.weddingCount > 0 && (
          <span className="text-xs text-muted">
            Changes apply to the {plan.weddingCount} wedding{plan.weddingCount === 1 ? "" : "s"} on this plan.
          </span>
        )}
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
        {state?.success && <span className="text-sm text-success">Saved</span>}
      </div>
    </form>
  );
}
