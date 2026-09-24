"use client";

import { useActionState } from "react";
import { saveCopy } from "@/lib/actions/design";
import { COPY_FIELDS, COPY_MAX_LENGTH, type CopyKey } from "@/lib/copy";
import { useAdminWeddingId } from "./wedding-context";

export type CopyView = Record<CopyKey, string | null> & {
  footerCredit: string | null;
  footerCreditUrl: string | null;
  asoebiEnabled: boolean;
  asoebiFabric: string | null;
};

const fieldClass = "border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-olive";

export default function WordingTab({ copy, canRemoveBranding }: { copy: CopyView; canRemoveBranding: boolean }) {
  const weddingId = useAdminWeddingId();
  const [state, formAction, pending] = useActionState(saveCopy.bind(null, weddingId), undefined);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-(family-name:--serif) text-2xl text-foreground">Site text</h2>
          <p className="mt-1 text-sm text-foreground/60">Leave a box empty to use the default wording shown in grey.</p>
        </div>
        {COPY_FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1.5 text-xs text-foreground/60">
            {field.label}
            <textarea
              name={field.key}
              defaultValue={copy[field.key] ?? ""}
              placeholder={field.fallback}
              maxLength={COPY_MAX_LENGTH}
              rows={field.fallback.length > 120 ? 4 : 2}
              className={fieldClass}
            />
            {"hint" in field && <span className="text-[11px] text-foreground/50">{field.hint}</span>}
          </label>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-(family-name:--serif) text-2xl text-foreground">RSVP email</h2>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="asoebiEnabled" defaultChecked={copy.asoebiEnabled} />
          Include an asoebi section with a WhatsApp order button
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          Asoebi fabric (optional)
          <input
            name="asoebiFabric"
            defaultValue={copy.asoebiFabric ?? ""}
            placeholder="e.g. Aso-oke — Burnt Orange & Olive Green"
            className={fieldClass}
          />
        </label>
        <p className="text-[11px] text-foreground/50">The WhatsApp button uses the first partner&apos;s phone number from Our Story.</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-(family-name:--serif) text-2xl text-foreground">Footer credit</h2>
        {!canRemoveBranding && (
          <p className="bg-cream px-3 py-2 text-xs text-foreground/70">
            Your plan shows &ldquo;Made with love by The Wedding Party&rdquo;. Upgrade to credit someone else, or no one.
          </p>
        )}
        <fieldset disabled={!canRemoveBranding} className="grid grid-cols-1 gap-3 disabled:opacity-50 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Made with love by…
            <input name="footerCredit" defaultValue={copy.footerCredit ?? ""} placeholder="Leave empty to hide" maxLength={80} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Link (optional)
            <input name="footerCreditUrl" type="url" defaultValue={copy.footerCreditUrl ?? ""} placeholder="https://" className={fieldClass} />
          </label>
        </fieldset>
        {/* A disabled fieldset doesn't submit; keep the saved values. */}
        {!canRemoveBranding && (
          <>
            <input type="hidden" name="footerCredit" value={copy.footerCredit ?? ""} />
            <input type="hidden" name="footerCreditUrl" value={copy.footerCreditUrl ?? ""} />
          </>
        )}
      </section>

      {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}
      {state?.success && <p className="text-xs text-olive">Saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start bg-burnt-orange px-6 py-2.5 text-xs font-medium text-ivory hover:bg-burnt-orange-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save wording"}
      </button>
    </form>
  );
}
