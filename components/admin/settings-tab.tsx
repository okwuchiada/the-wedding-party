"use client";

import { useActionState, useState } from "react";
import { saveSettings, setPublished } from "@/lib/actions/settings";
import { CURRENCIES, formatMoney, LOCALES } from "@/lib/money";
import { useAdminWeddingId } from "./wedding-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FIELD, FIELD_LABEL } from "./form-styles";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
    <Card className="gap-3 rounded-md border-transparent p-5 shadow-none">
      <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">
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
        <Button
          type="button"
          variant={live ? "outline" : "default"}
          size="sm"
          onClick={toggle}
          disabled={pending || (!live && !settings.canPublish)}
          className={cn("self-start px-5 disabled:opacity-50", live && "border-mist hover:border-coral-deep hover:text-coral-deep")}
        >
          {pending ? "Saving…" : live ? "Unpublish" : "Publish site"}
        </Button>
      )}
      {error && <p className="text-xs text-burnt-orange">{error}</p>}
    </Card>
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
          <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Web address</h2>
          <div className="flex items-center rounded-md border border-mist bg-white focus-within:border-ink/50 focus-within:ring-3 focus-within:ring-gold/35">
            <span className="pl-3 text-sm text-ink/50">/w/</span>
            <Input
              name="slug"
              aria-label="Web address"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="h-auto border-0 px-1 py-2 text-ink focus-visible:ring-0"
            />
          </div>
          {slug !== settings.slug && (
            <p className="text-xs text-burnt-orange">Links you&apos;ve already shared will stop working if you change this.</p>
          )}
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground sm:col-span-3">Money &amp; phone</h2>
          <Label className={FIELD_LABEL}>
            Currency
            <Select name="currency" value={currency} onValueChange={setCurrency}>
              <SelectTrigger className={cn(FIELD, "w-full data-[size=default]:h-auto")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <Label className={FIELD_LABEL}>
            Number format
            <Select name="locale" value={locale} onValueChange={setLocale}>
              <SelectTrigger className={cn(FIELD, "w-full data-[size=default]:h-auto")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <Label className={FIELD_LABEL}>
            Phone country code
            <Input name="phoneCountryCode" defaultValue={settings.phoneCountryCode} inputMode="numeric" className={FIELD} />
          </Label>
          <p className="text-xs text-foreground/60 sm:col-span-3">
            Example: {formatMoney(2_500_000, { currency, locale })}.
            {currency !== settings.currency && " Existing prices keep their amounts; only the currency label changes."}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Guests</h2>
          <Label className={FIELD_LABEL}>
            Maximum attending guests (your plan allows {settings.guestLimit.toLocaleString()})
            <Input
              name="maxGuests"
              type="number"
              min={1}
              max={settings.guestLimit}
              defaultValue={settings.maxGuests}
              className={FIELD}
            />
          </Label>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Who can view the site</h2>
          <Label className={FIELD_LABEL}>
            Only allow visitors from these countries (two-letter codes, e.g. NG, GH). Leave empty for everyone.
            <Input name="allowedCountries" defaultValue={settings.allowedCountries.join(", ")} className={FIELD} />
          </Label>
          <Label className={FIELD_LABEL}>
            Access code for guests outside those countries
            <Input name="geoBypassToken" defaultValue={settings.geoBypassToken ?? ""} autoComplete="off" className={FIELD} />
          </Label>
        </section>

        {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}
        {state?.success && <p className="text-xs text-olive">Saved.</p>}
        <Button type="submit" size="lg" disabled={pending} className="self-start">
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}
