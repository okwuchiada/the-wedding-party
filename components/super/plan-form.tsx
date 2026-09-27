"use client";

import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { savePlan } from "@/lib/actions/super";
import { ResultText } from "@/components/result-text";
import { FEATURE_LABELS, UNLIMITED_GUESTS, type PlanFeature } from "@/lib/plans";

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

const field = "h-8 px-2.5 py-1.5 text-ink disabled:bg-paper disabled:opacity-100 disabled:text-ink/40";
const label = "flex-col items-stretch gap-1 text-xs font-normal text-ink/60";
const check = "font-normal text-ink";

/** One labelled group of settings: the label on the left, the fields on the right. */
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 border-t border-mist py-4 first-of-type:border-t-0 first-of-type:pt-0 sm:grid-cols-[9rem_1fr] sm:gap-6">
      <div>
        <h4 className="text-sm font-semibold">{title}</h4>
        {hint && <p className="mt-0.5 text-xs text-ink/50">{hint}</p>}
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
    <div className={`flex ${label}`}>
      {title}
      <Input
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
      <Label className="gap-1.5 text-xs font-normal text-ink/70">
        <Checkbox checked={noLimit} onCheckedChange={(v) => setNoLimit(v === true)} />
        {noLimitLabel}
      </Label>
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
          <Label className={label}>
            Name
            <Input name="name" defaultValue={plan?.name} required className={field} />
          </Label>
          <Label className={label}>
            Price (₦)
            <Input name="priceNaira" type="number" min={0} step="0.01" defaultValue={plan ? plan.priceKobo / 100 : ""} required className={field} />
          </Label>
          <Label className={label}>
            Key
            <Input name="key" defaultValue={plan?.key} required className={field} />
          </Label>
          <Label className={label}>
            Order
            <Input name="sortOrder" type="number" defaultValue={plan?.sortOrder ?? 0} className={field} />
          </Label>
          <Label className={`${label} col-span-2 sm:col-span-4`}>
            Tagline
            <Input name="tagline" defaultValue={plan?.tagline ?? ""} maxLength={120} className={field} />
          </Label>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <Label className={check}>
            <Checkbox name="active" defaultChecked={plan?.active ?? true} />
            On sale
          </Label>
          <Label className={check}>
            <Checkbox name="popular" defaultChecked={plan?.popular ?? false} />
            Most popular
          </Label>
        </div>
        <p className="mt-2 text-xs text-ink/50">A price of 0 makes this the free plan new weddings start on.</p>
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
            <Label key={f} className={check}>
              <Checkbox name={`feature_${f}`} defaultChecked={plan?.features[f] === true} />
              {FEATURE_LABELS[f]}
            </Label>
          ))}
        </div>
      </Section>

      <Section title="Themes">
        <Label className={check}>
          <Checkbox checked={allThemes} onCheckedChange={(v) => setAllThemes(v === true)} />
          Every theme
        </Label>
        {/* Unticked themes aren't submitted, so "every theme" simply sends none. */}
        {!allThemes && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <p className="col-span-2 text-xs text-ink/50 sm:col-span-3">Tick the themes this plan includes. None ticked means every theme.</p>
            {themes.map((t) => (
              <Label key={t.key} className={check}>
                <Checkbox name="themes" value={t.key} defaultChecked={plan?.themes.includes(t.key) ?? false} />
                {t.name}
              </Label>
            ))}
          </div>
        )}
      </Section>

      <Section title="Pricing page text" hint="What couples read. Keep it in step with the limits and unlocks above.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Label className={label}>
            Features, one per line
            <Textarea name="highlights" rows={6} defaultValue={plan?.highlights.join("\n")} className="field-sizing-fixed text-ink" />
          </Label>
          <Label className={label}>
            Limits, one per line
            <Textarea name="limitations" rows={6} defaultValue={plan?.limitations.join("\n")} className="field-sizing-fixed text-ink" />
          </Label>
        </div>
      </Section>

      <div className="flex flex-wrap items-center gap-3 border-t border-mist pt-4">
        <Button type="submit" variant="ink" size="sm" disabled={pending} className="px-5 text-sm">
          {pending ? "Saving…" : plan ? "Save plan" : "Create plan"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-sm">
            Cancel
          </Button>
        )}
        {plan && plan.weddingCount > 0 && (
          <span className="text-xs text-ink/55">
            Changes apply to the {plan.weddingCount} wedding{plan.weddingCount === 1 ? "" : "s"} on this plan.
          </span>
        )}
        <ResultText error={state?.error} message={state?.success ? "Saved" : undefined} className="text-sm" />
      </div>
    </form>
  );
}
