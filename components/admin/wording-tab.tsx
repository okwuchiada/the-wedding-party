"use client";

import { useActionState } from "react";
import { saveCopy } from "@/lib/actions/design";
import { COPY_FIELDS, COPY_MAX_LENGTH, type CopyKey } from "@/lib/copy";
import { useAdminWeddingId } from "./wedding-context";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FIELD, FIELD_LABEL } from "./form-styles";
import { cn } from "@/lib/utils";

export type CopyView = Record<CopyKey, string | null> & {
  footerCredit: string | null;
  footerCreditUrl: string | null;
  asoebiEnabled: boolean;
  asoebiFabric: string | null;
};

export default function WordingTab({
  copy,
  canCustomCredit,
  brandingRemoved,
}: {
  copy: CopyView;
  /** The plan lets the couple write their own footer credit. */
  canCustomCredit: boolean;
  /** The plan hides Vowly's credit (with or without a credit of their own). */
  brandingRemoved: boolean;
}) {
  const weddingId = useAdminWeddingId();
  const [state, formAction, pending] = useActionState(saveCopy.bind(null, weddingId), undefined);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Site text</h2>
          <p className="mt-1 text-sm text-foreground/60">Leave a box empty to use the default wording shown in grey.</p>
        </div>
        {COPY_FIELDS.map((field) => (
          <Label key={field.key} className={FIELD_LABEL}>
            {field.label}
            <Textarea
              name={field.key}
              defaultValue={copy[field.key] ?? ""}
              placeholder={field.fallback}
              maxLength={COPY_MAX_LENGTH}
              rows={field.fallback.length > 120 ? 4 : 2}
              className={cn(FIELD, "field-sizing-fixed")}
            />
            {"hint" in field && <span className="text-[11px] text-ink/50">{field.hint}</span>}
          </Label>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">RSVP email</h2>
        <Label className="font-normal text-ink">
          <Checkbox name="asoebiEnabled" defaultChecked={copy.asoebiEnabled} />
          Include an asoebi section with a WhatsApp order button
        </Label>
        <Label className={FIELD_LABEL}>
          Asoebi fabric (optional)
          <Input
            name="asoebiFabric"
            defaultValue={copy.asoebiFabric ?? ""}
            placeholder="e.g. Aso-oke — Burnt Orange & Olive Green"
            className={FIELD}
          />
        </Label>
        <p className="text-[11px] text-foreground/50">The WhatsApp button uses the first partner&apos;s phone number from Our Story.</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Footer credit</h2>
        {!canCustomCredit && (
          <Alert className="border-transparent bg-accent">
            <AlertDescription className="text-xs text-ink/70">
              {brandingRemoved
                ? "Your plan leaves the footer credit off. Upgrade to Forever to credit someone of your choice."
                : "Your plan shows \u201cMade with love by Vowly\u201d. Upgrade to remove it, or to Forever to credit someone of your choice."}
            </AlertDescription>
          </Alert>
        )}
        <fieldset disabled={!canCustomCredit} className="grid grid-cols-1 gap-3 disabled:opacity-50 sm:grid-cols-2">
          <Label className={FIELD_LABEL}>
            Made with love by…
            <Input name="footerCredit" defaultValue={copy.footerCredit ?? ""} placeholder="Leave empty to hide" maxLength={80} className={FIELD} />
          </Label>
          <Label className={FIELD_LABEL}>
            Link (optional)
            <Input name="footerCreditUrl" type="url" defaultValue={copy.footerCreditUrl ?? ""} placeholder="https://" className={FIELD} />
          </Label>
        </fieldset>
        {/* A disabled fieldset doesn't submit; keep the saved values. */}
        {!canCustomCredit && (
          <>
            <input type="hidden" name="footerCredit" value={copy.footerCredit ?? ""} />
            <input type="hidden" name="footerCreditUrl" value={copy.footerCreditUrl ?? ""} />
          </>
        )}
      </section>

      {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}
      {state?.success && <p className="text-xs text-olive">Saved.</p>}
      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save wording"}
      </Button>
    </form>
  );
}
