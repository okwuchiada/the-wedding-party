"use client";

import { useActionState, useEffect, useState } from "react";
import { AuthMessage, AuthSubmit, authInputClass } from "@/components/auth/fields";
import DatePicker from "@/components/marketing/date-picker";
import SitePreview from "@/components/marketing/site-preview";
import { checkSlugAvailable, createWedding } from "@/lib/actions/weddings";
import { suggestWeddingSlug } from "@/lib/slug";
import { getPreset, THEME_PRESETS } from "@/lib/themes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SlugCheck = { slug: string; available: boolean; reason?: string };

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

function formatDateLabel(date: string) {
  if (!date) return "Your wedding date";
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "Your wedding date";
  return parsed.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-(--m-mist) pt-8 sm:grid-cols-[3.5rem_1fr]">
      <span aria-hidden className="font-(family-name:--m-display) text-4xl leading-none font-extrabold text-(--m-gold) sm:text-5xl">
        {number}
      </span>
      <div>
        <legend className="mb-5 font-(family-name:--m-display) text-2xl font-bold tracking-tight">{title}</legend>
        {children}
      </div>
    </fieldset>
  );
}

export default function CreateWeddingForm({
  initialNames = { bride: "", groom: "" },
}: {
  /** From sign-up: the account holder's name and their partner's. */
  initialNames?: { bride: string; groom: string };
}) {
  const [state, action, pending] = useActionState(createWedding, undefined);
  const [names, setNames] = useState(initialNames);
  const [date, setDate] = useState("");
  const [slug, setSlug] = useState(() =>
    initialNames.bride && initialNames.groom ? suggestWeddingSlug(initialNames.bride, initialNames.groom) : ""
  );
  const [slugEdited, setSlugEdited] = useState(false);
  const [check, setCheck] = useState<SlugCheck | null>(null);
  const [presetKey, setPresetKey] = useState("adire-indigo");
  const preset = getPreset(presetKey);

  const updateName = (key: "bride" | "groom", value: string) => {
    const next = { ...names, [key]: value };
    setNames(next);
    if (!slugEdited) setSlug(suggestWeddingSlug(next.bride, next.groom));
  };

  // Check the web address shortly after typing stops.
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await checkSlugAvailable(slug);
      if (!cancelled) setCheck({ slug, ...result });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug]);
  const status = slug && check?.slug === slug ? check : null;

  return (
    // On phones the preview sits between the steps and the button; on wide screens it's a sticky side column.
    <form
      action={action}
      className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:grid-rows-[auto_1fr] lg:gap-x-16"
    >
      <div className="flex flex-col gap-10 lg:col-start-1 lg:row-start-1">
        <Step number={1} title="Who's getting married?">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Label className="flex-col items-stretch gap-1.5">
              Your name
              <Input
                name="brideName"
                required
                autoComplete="name"
                value={names.bride}
                onChange={(e) => updateName("bride", e.target.value)}
                className={authInputClass}
              />
            </Label>
            <Label className="flex-col items-stretch gap-1.5">
              Your partner&apos;s name
              <Input name="groomName" required value={names.groom} onChange={(e) => updateName("groom", e.target.value)} className={authInputClass} />
            </Label>
            <div className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2 sm:max-w-sm">
              <span id="wedding-date-label">Wedding date</span>
              <DatePicker name="weddingDate" value={date} onChange={setDate} labelledBy="wedding-date-label" />
            </div>
          </div>
        </Step>

        <Step number={2} title="Your web address">
          <p className="mb-3 text-(--m-ink)/70">This is the link you&apos;ll share with guests. You can change it later.</p>
          <div className="flex items-center rounded-[6px] border border-(--m-mist) bg-white focus-within:border-(--m-ink)/50 focus-within:ring-3 focus-within:ring-(--m-gold)/35">
            <span className="pl-3.5 text-base text-(--m-ink)/50">/w/</span>
            <Input
              name="slug"
              required
              aria-label="Web address"
              aria-describedby="slug-status"
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value.toLowerCase());
              }}
              className="h-auto border-0 px-1 py-3 text-base focus-visible:ring-0 md:text-base"
            />
          </div>
          <p
            id="slug-status"
            aria-live="polite"
            className={`mt-2 min-h-5 text-sm ${status?.available === false ? "text-(--m-coral-deep)" : "text-(--m-emerald)"}`}
          >
            {status ? (status.available ? "That address is free" : status.reason) : ""}
          </p>
        </Step>

        <Step number={3} title="Pick a look">
          <p className="mb-4 text-(--m-ink)/70">Colours and fonts for your site. You can fine-tune everything later.</p>
          <input type="hidden" name="presetKey" value={presetKey} />
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {THEME_PRESETS.map((p) => {
              const selected = p.key === presetKey;
              return (
                <button
                  key={p.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPresetKey(p.key)}
                  className={`flex flex-col gap-2 rounded-[6px] bg-white p-2 text-left text-xs font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--m-ink) ${
                    selected ? "ring-2 ring-(--m-ink)" : "ring-1 ring-(--m-mist) hover:ring-(--m-ink)/40"
                  }`}
                >
                  <span className="flex h-9 overflow-hidden rounded-[3px]">
                    {(["primary", "cream", "accent", "background", "primaryDark"] as const).map((k, i) => (
                      <span key={k} style={{ background: p.colors[k], flexGrow: i % 2 ? 1 : 2 }} />
                    ))}
                  </span>
                  {p.name}
                </button>
              );
            })}
          </div>
        </Step>

      </div>

      <div className="flex flex-col gap-4 border-t border-(--m-mist) pt-8 sm:max-w-sm lg:col-start-1 lg:row-start-2 lg:self-start">
        <AuthMessage error={state?.error} />
        <AuthSubmit pending={pending} label="Create my site" pendingLabel="Creating your site…" />
      </div>

      <div className="row-start-2 lg:sticky lg:top-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        <SitePreview
          preset={preset}
          names={[firstName(names.bride) || "Your name", firstName(names.groom) || "Your partner"]}
          dateLabel={formatDateLabel(date)}
          place=""
        />
        <p className="mt-3 text-sm text-(--m-ink)/60">How guests will see your site.</p>
      </div>
    </form>
  );
}
