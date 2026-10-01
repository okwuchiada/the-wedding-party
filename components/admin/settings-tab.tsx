"use client";

import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { checkSlugAvailable } from "@/lib/actions/weddings";
import { saveSettings } from "@/lib/actions/settings";
import PublishControl from "./publish-control";
import { GEO_BYPASS_PARAM } from "@/lib/geo-param";
import { CURRENCIES, currencySymbol, formatMoney, localeLabel, LOCALES } from "@/lib/money";
import type { CountryOption } from "@/lib/countries";
import CountryPicker from "./country-picker";
import { useAdminWeddingId } from "./wedding-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountryCodeField, SelectInput, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SectionHeading } from "@/components/ui/section-heading";
import { useSuccessToast, useToast } from "@/components/ui/toast";
import { Label } from "@/components/ui/label";
import { MAX_PARTY_SIZE } from "@/lib/rsvp-rules";
import { Copy } from "lucide-react";
import { slugFromInput } from "@/lib/slug";

export type SettingsView = {
  slug: string;
  /** The full link to share (own domain, or site address + /w/slug); null when the site address isn't configured. */
  shareUrl: string | null;
  status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  canPublish: boolean;
  currency: string;
  locale: string;
  phoneCountryCode: string;
  maxGuests: number;
  /** Guests per RSVP, including the person replying. */
  maxPartySize: number;
  guestLimit: number;
  allowedCountries: string[];
  geoBypassToken: string | null;
  /** Every country, from the Country table, for the "Who can view the site" picker. */
  countries: CountryOption[];
};

function PublishPanel({ settings }: { settings: SettingsView }) {
  const live = settings.status === "ACTIVE";
  const locked = settings.status === "SUSPENDED" || settings.status === "ARCHIVED";

  return (
    <Card className="gap-0 rounded-md p-5 shadow-none flex flex-col gap-3">
      <h2 className="font-(family-name:--m-display) text-2xl font-bold tracking-tight text-ink">
        {locked ? "Suspended" : live ? "Your site is live" : "Your site is a draft"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {locked
          ? "This wedding has been suspended. Contact support to restore it."
          : live
            ? "Guests with the link can see your site and RSVP."
            : settings.canPublish
              ? "Only you can see it. Publish when you're ready for guests."
              : "Only you can see it. Choose a plan to publish it for guests."}
      </p>
      <PublishControl status={settings.status} canPublish={settings.canPublish} />
    </Card>
  );
}

type SlugCheck = { slug: string; available: boolean; reason?: string };

/** Checks a new web address shortly after typing stops, like the create-wedding form. */
function useSlugCheck(slug: string, saved: string) {
  const [check, setCheck] = useState<SlugCheck | null>(null);
  useEffect(() => {
    if (!slug || slug === saved) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await checkSlugAvailable(slug);
      if (!cancelled) setCheck({ slug, ...result });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, saved]);
  return slug && slug !== saved && check?.slug === slug ? check : null;
}

export default function SettingsTab({ settings, guestUrl }: { settings: SettingsView; guestUrl: string }) {
  const weddingId = useAdminWeddingId();
  const toast = useToast();
  // The saved address, in full. Without a configured site address, use the one this dashboard is on.
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ""
  );
  const shareLink = settings.shareUrl ?? `${origin}${guestUrl}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({ message: "Link copied" });
    } catch {
      toast({ message: "Couldn't copy. Select the link and copy it yourself.", tone: "error" });
    }
  };
  const [state, formAction, pending] = useActionState(saveSettings.bind(null, weddingId), undefined);
  useSuccessToast(state, "Settings saved");
  const [currency, setCurrency] = useState(settings.currency);
  const [locale, setLocale] = useState(settings.locale);
  const [slug, setSlug] = useState(settings.slug);
  const [pastedLink, setPastedLink] = useState(false);
  const slugStatus = useSlugCheck(slug, settings.slug);

  const copyAccessLink = async () => {
    const link = `${window.location.origin}${guestUrl}?${GEO_BYPASS_PARAM}=${encodeURIComponent(settings.geoBypassToken ?? "")}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({ message: "Link copied" });
    } catch {
      toast({ message: `Copy this link: ${link}`, tone: "error" });
    }
  };

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <PublishPanel settings={settings} />

      <form action={formAction} className="flex flex-col gap-5">
        <Card className="gap-0 rounded-md p-5 shadow-none block">
          <SectionHeading as="h3" title="Web address" description="The link you share with guests." />
          <Label htmlFor="settings-slug" className="sr-only">
            Web address
          </Label>
          <div className="flex items-center rounded-[6px] border border-border bg-card focus-within:border-ink/50 focus-within:ring-3 focus-within:ring-gold/35">
            <span className="pl-3.5 text-[15px] text-muted-foreground">/w/</span>
            <input
              id="settings-slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value.toLowerCase());
                setPastedLink(false);
              }}
              // Couples often paste their whole link back in; keep just the address part.
              onPaste={(e) => {
                const pasted = slugFromInput(e.clipboardData.getData("text"));
                if (!pasted.fromLink) return;
                e.preventDefault();
                setSlug(pasted.slug);
                setPastedLink(true);
              }}
              aria-describedby="settings-slug-status"
              className="w-full rounded-[6px] px-1 py-2.5 text-[15px] text-ink outline-none"
            />
          </div>
          <div id="settings-slug-status" aria-live="polite" className="mt-2 flex flex-col gap-1 text-[13px]">
            {slugStatus && (
              <span className={slugStatus.available ? "font-semibold text-emerald" : "text-destructive"}>
                {slugStatus.available ? "✓ That address is free" : slugStatus.reason}
              </span>
            )}
            {pastedLink && <span className="text-muted-foreground">We kept just the address part of the link you pasted.</span>}
            {slug !== settings.slug && <span className="text-destructive">Links you&apos;ve already shared will stop working if you change this.</span>}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-accent px-3.5 py-2.5">
            <span className="min-w-0 text-sm">
              <span className="block text-[13px] text-muted-foreground">Your link</span>
              <span className="font-medium break-all text-ink select-all">{shareLink}</span>
            </span>
            <Button type="button" variant="outline" size="sm" onClick={copyLink} className="bg-card">
              <Copy aria-hidden />
              Copy link
            </Button>
          </div>
        </Card>

        <Card className="gap-0 rounded-md p-5 shadow-none block">
          <SectionHeading as="h3" title="Money and phone" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SelectInput
              label="Currency"
              name="currency"
              value={currency}
              onValueChange={setCurrency}
              options={CURRENCIES.map((c) => ({ value: c, label: `${c} (${currencySymbol({ currency: c, locale })})` }))}
            />
            <SelectInput
              label="Number style"
              name="locale"
              value={locale}
              onValueChange={setLocale}
              options={LOCALES.map((l) => ({ value: l, label: localeLabel(l, currency) }))}
            />
            <CountryCodeField label="Phone country code" name="phoneCountryCode" defaultValue={settings.phoneCountryCode} maxLength={4} />
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground">
            Example: {formatMoney(2_500_000, { currency, locale })}.
            {currency !== settings.currency && " Existing prices keep their amounts; only the currency label changes."}
          </p>
        </Card>

        <Card className="gap-0 rounded-md p-5 shadow-none block">
          <SectionHeading as="h3" title="Guests" />
          <TextInput
            label="Most guests attending"
            name="maxGuests"
            type="number"
            min={1}
            max={settings.guestLimit}
            defaultValue={settings.maxGuests}
            hint={`Your plan allows up to ${settings.guestLimit.toLocaleString()}.`}
          />
          <div className="mt-4">
            <SelectInput
              label="Guests per RSVP"
              name="maxPartySize"
              defaultValue={String(settings.maxPartySize)}
              options={Array.from({ length: MAX_PARTY_SIZE }, (_, i) => ({
                value: String(i + 1),
                label: i === 0 ? "1 (just the guest)" : `Up to ${i + 1}`,
              }))}
              hint="How many people one reply can bring, including the guest. Replies already in keep their numbers."
            />
          </div>
        </Card>

        <Card className="gap-0 rounded-md p-5 shadow-none block">
          <SectionHeading as="h3" title="Who can view the site" description="Limit the site to some countries. Guests elsewhere can use an access code." />
          <div className="flex flex-col gap-4">
            <CountryPicker name="allowedCountries" countries={settings.countries} defaultValue={settings.allowedCountries} />
            <TextInput
              label="Access code for guests abroad"
              name="geoBypassToken"
              defaultValue={settings.geoBypassToken ?? ""}
              autoComplete="off"
              hint="Guests who open your link with this code can see the site from anywhere."
            />
            {settings.geoBypassToken && (
              <Button variant="outline" size="sm" className="self-start" onClick={copyAccessLink}>
                Copy link for guests abroad
              </Button>
            )}
          </div>
        </Card>

        {state?.error && <Notice tone="error">{state.error}</Notice>}
        <Button type="submit" size="lg" className="self-start" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}
