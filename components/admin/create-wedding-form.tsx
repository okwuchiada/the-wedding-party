"use client";

import { useActionState, useState } from "react";
import { createWedding } from "@/lib/actions/weddings";
import { suggestWeddingSlug } from "@/lib/slug";

const inputClass =
  "border border-olive/20 bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-olive";

export default function CreateWeddingForm() {
  const [state, action, pending] = useActionState(createWedding, undefined);
  const [names, setNames] = useState({ bride: "", groom: "" });
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const updateName = (key: "bride" | "groom", value: string) => {
    const next = { ...names, [key]: value };
    setNames(next);
    if (!slugEdited) setSlug(suggestWeddingSlug(next.bride, next.groom));
  };

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          Partner one
          <input
            name="brideName"
            required
            value={names.bride}
            onChange={(e) => updateName("bride", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          Partner two
          <input
            name="groomName"
            required
            value={names.groom}
            onChange={(e) => updateName("groom", e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Wedding date
        <input type="date" name="weddingDate" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Web address
        <div className="flex items-center border border-olive/20 bg-white focus-within:border-olive">
          <span className="pl-3 text-sm text-foreground/50">/w/</span>
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(e.target.value.toLowerCase());
            }}
            className="w-full px-1 py-2.5 text-sm text-foreground outline-none"
          />
        </div>
      </label>
      {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-burnt-orange px-6 py-2.5 text-xs font-medium text-ivory transition-colors hover:bg-burnt-orange-dark disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create wedding"}
      </button>
    </form>
  );
}
