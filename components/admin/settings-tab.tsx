"use client";

import { useActionState, useState } from "react";
import { saveSettings, setPublished } from "@/lib/actions/settings";
import { CURRENCIES, formatMoney, LOCALES } from "@/lib/money";
import { useAdminWeddingId } from "./wedding-context";

export type SettingsView = {
  slug: string;
  status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  canPublish: boolean;
  currency: string;
  locale: string;
  phoneCountryCode: string;
  maxGuests: number;
  guestLimit: number;
  allowedCountries: string[];
  geoBypassToken: string | null;
};

const fieldClass = "border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-olive";

function PublishPanel({ settings }: { settings: SettingsView }) {
  const weddingId = useAdminWeddingId();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const live = settings.status === "ACTIVE";
  const locked = settings.status === "SUSPENDED" || settings.status === "ARCHIVED";

  const toggle = async () => {
    setPending(true);
    const result = await setPublished(weddingId, !live);
    setError(result.error ?? "");
    setPending(false);
  };

  return (
    <section className="flex flex-col gap-3 bg-white p-5">
      <h2 className="font-(family-name:--serif) text-2xl text-foreground">
        {locked ? "Suspended" : live ? "Your site is live" : "Your site is a draft"}
      </h2>
      <p className="text-sm text-foreground/70">
        {locked
          ? "This wedding has been suspended. Contact support to restore it."
          : live
            ? "Guests with the link can see your site and RSVP."
            : settings.canPublish
              ? "Only you can see it. Publish when you're ready for guests."
              : "Only you can see it. Choose a plan to publish it for guests."}
      </p>
      {!locked && (
        <button
          type="button"
          onClick={toggle}
          disabled={pending || (!live && !settings.canPublish)}
          className={`self-start px-5 py-2 text-xs font-medium disabled:opacity-50 ${
            live
              ? "border border-olive/30 text-foreground hover:border-burnt-orange hover:text-burnt-orange"
              : "bg-burnt-orange text-ivory hover:bg-burnt-orange-dark"
          }`}
        >
          {pending ? "Saving…" : live ? "Unpublish" : "Publish site"}
        </button>
      )}
      {error && <p className="text-xs text-burnt-orange">{error}</p>}
    </section>
  );
}

export default function SettingsTab({ settings }: { settings: SettingsView }) {
  const weddingId = useAdminWeddingId();
  const [state, formAction, pending] = useActionState(saveSettings.bind(null, weddingId), undefined);
  const [currency, setCurrency] = useState(settings.currency);
  const [locale, setLocale] = useState(settings.locale);
  const [slug, setSlug] = useState(settings.slug);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <PublishPanel settings={settings} />

      <form action={formAction} className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h2 className="font-(family-name:--serif) text-2xl text-foreground">Web address</h2>
          <div className="flex items-center border border-olive/20 bg-white focus-within:border-olive">
            <span className="pl-3 text-sm text-foreground/50">/w/</span>
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="w-full px-1 py-2 text-sm text-foreground outline-none"
            />
          </div>
          {slug !== settings.slug && (
            <p className="text-xs text-burnt-orange">Links you&apos;ve already shared will stop working if you change this.</p>
          )}
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <h2 className="font-(family-name:--serif) text-2xl text-foreground sm:col-span-3">Money &amp; phone</h2>
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Currency
            <select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={fieldClass}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Number format
            <select name="locale" value={locale} onChange={(e) => setLocale(e.target.value)} className={fieldClass}>
              {LOCALES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Phone country code
            <input name="phoneCountryCode" defaultValue={settings.phoneCountryCode} inputMode="numeric" className={fieldClass} />
          </label>
          <p className="text-xs text-foreground/60 sm:col-span-3">
            Example: {formatMoney(2_500_000, { currency, locale })}.
            {currency !== settings.currency && " Existing prices keep their amounts; only the currency label changes."}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-(family-name:--serif) text-2xl text-foreground">Guests</h2>
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Maximum attending guests (your plan allows {settings.guestLimit.toLocaleString()})
            <input
              name="maxGuests"
              type="number"
              min={1}
              max={settings.guestLimit}
              defaultValue={settings.maxGuests}
              className={fieldClass}
            />
          </label>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-(family-name:--serif) text-2xl text-foreground">Who can view the site</h2>
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Only allow visitors from these countries (two-letter codes, e.g. NG, GH). Leave empty for everyone.
            <input name="allowedCountries" defaultValue={settings.allowedCountries.join(", ")} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Access code for guests outside those countries
            <input name="geoBypassToken" defaultValue={settings.geoBypassToken ?? ""} autoComplete="off" className={fieldClass} />
          </label>
        </section>

        {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}
        {state?.success && <p className="text-xs text-olive">Saved.</p>}
        <button
          type="submit"
          disabled={pending}
          className="self-start bg-burnt-orange px-6 py-2.5 text-xs font-medium text-ivory hover:bg-burnt-orange-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
