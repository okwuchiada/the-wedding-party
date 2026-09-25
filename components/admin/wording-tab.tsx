"use client";

import { useActionState, useState } from "react";
import { saveCopy } from "@/lib/actions/design";
import { COPY_FIELDS, COPY_MAX_LENGTH, type CopyKey } from "@/lib/copy";
import { creditUpgradeNotice } from "@/lib/credit-notice";
import { useAdminWeddingId } from "./wedding-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inputClass, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSuccessToast } from "@/components/ui/toast";

export type CopyView = Record<CopyKey, string | null> & {
  footerCredit: string | null;
  footerCreditUrl: string | null;
  asoebiEnabled: boolean;
  asoebiFabric: string | null;
};

type CopyField = (typeof COPY_FIELDS)[number];

/**
 * One piece of site text. Empty means guests see the default, which is shown
 * under the box as real text instead of a grey placeholder that looks filled in.
 */
function CopyInput({ field, initial }: { field: CopyField; initial: string }) {
  const [value, setValue] = useState(initial);
  const id = `copy-${field.key}`;
  const empty = !value.trim();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {field.label}
      </label>
      <textarea
        id={id}
        name={field.key}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={COPY_MAX_LENGTH}
        rows={field.fallback.length > 120 ? 4 : 2}
        aria-describedby={`${id}-help`}
        className={`${inputClass} resize-y`}
      />
      <div id={`${id}-help`} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-[13px] text-muted">
        <span className="min-w-0 flex-1">
          {empty ? <>Guests see: &ldquo;{field.fallback}&rdquo;</> : "Your own wording."}
          {"hint" in field && <> {field.hint}</>}
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="tabular-nums">
            {value.length}/{COPY_MAX_LENGTH}
          </span>
          {empty ? (
            <Button variant="text" size="sm" onClick={() => setValue(field.fallback)}>
              Start from this
            </Button>
          ) : (
            <Button variant="text" size="sm" onClick={() => setValue("")}>
              Use the default
            </Button>
          )}
        </span>
      </div>
    </div>
  );
}

export default function WordingTab({
  copy,
  canCustomCredit,
  brandingRemoved,
  plans,
}: {
  copy: CopyView;
  /** The plan lets the couple write their own footer credit. */
  canCustomCredit: boolean;
  /** The plan hides Vowly's credit (with or without a credit of their own). */
  brandingRemoved: boolean;
  /** The cheapest plans that remove the credit or allow their own, by current name. */
  plans: { brandingPlan: string | null; creditPlan: string | null };
}) {
  const weddingId = useAdminWeddingId();
  const [state, formAction, pending] = useActionState(saveCopy.bind(null, weddingId), undefined);
  useSuccessToast(state, "Wording saved");

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-5">
      <Card as="section">
        <SectionHeading as="h3" title="Site text" description="Leave a box empty to use the default wording." />
        <div className="flex flex-col gap-5">
          {COPY_FIELDS.map((field) => (
            <CopyInput key={field.key} field={field} initial={copy[field.key] ?? ""} />
          ))}
        </div>
      </Card>

      <Card as="section">
        <SectionHeading as="h3" title="Asoebi" description="Show a section about the fabric, with a WhatsApp button to order it." />
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2.5 text-sm text-ink">
            <input type="checkbox" name="asoebiEnabled" defaultChecked={copy.asoebiEnabled} className="size-4 accent-[var(--success)]" />
            Show the asoebi section
          </label>
          <TextInput
            label="Fabric (optional)"
            name="asoebiFabric"
            defaultValue={copy.asoebiFabric ?? ""}
            placeholder="e.g. Aso-oke, burnt orange and olive green"
            hint="The WhatsApp button uses the first partner's phone number from Our story."
          />
        </div>
      </Card>

      <Card as="section">
        <SectionHeading as="h3" title="Footer credit" />
        {!canCustomCredit && (
          <div className="mb-4">
            <Notice tone="info">{creditUpgradeNotice({ brandingRemoved, ...plans })}</Notice>
          </div>
        )}
        <fieldset disabled={!canCustomCredit} className="grid grid-cols-1 gap-4 disabled:opacity-60 sm:grid-cols-2">
          <TextInput label="Made with love by…" name="footerCredit" defaultValue={copy.footerCredit ?? ""} placeholder="Leave empty to hide" maxLength={80} />
          <TextInput label="Link (optional)" name="footerCreditUrl" type="url" defaultValue={copy.footerCreditUrl ?? ""} placeholder="https://" />
        </fieldset>
        {/* A disabled fieldset doesn't submit; keep the saved values. */}
        {!canCustomCredit && (
          <>
            <input type="hidden" name="footerCredit" value={copy.footerCredit ?? ""} />
            <input type="hidden" name="footerCreditUrl" value={copy.footerCreditUrl ?? ""} />
          </>
        )}
      </Card>

      {state?.error && <Notice tone="error">{state.error}</Notice>}
      <Button type="submit" size="lg" className="self-start" pending={pending} pendingLabel="Saving…">
        Save wording
      </Button>
    </form>
  );
}
