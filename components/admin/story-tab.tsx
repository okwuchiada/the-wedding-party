"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { saveStory } from "@/lib/actions/story";
import {
  addStoryPhoto,
  deleteStoryPhoto,
  updateStoryPhoto,
  type StoryPhotoFormState,
} from "@/lib/actions/story-photos";
import { useConfirm } from "./use-confirm";
import { useActionPending } from "./use-action-pending";

export type StoryContentView = {
  brideName: string;
  groomName: string;
  weddingDate: string;
  weddingTime: string;
  tagline: string | null;
  location: string | null;
  howWeMet: string | null;
  whatWeLove: string | null;
  groomNote: string | null;
  brideNote: string | null;
  heroPhotoUrl: string | null;
  contactEmail: string | null;
};

export type StoryPhotoView = {
  id: string;
  url: string;
  caption: string;
  order: number;
  showInHero: boolean;
};

function PhotoForm({
  action,
  initialValues,
  onCancel,
  submitLabel,
}: {
  action: (state: StoryPhotoFormState, formData: FormData) => Promise<StoryPhotoFormState>;
  initialValues?: { id?: string; url?: string; caption?: string; order?: number; showInHero?: boolean };
  onCancel: () => void;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) onCancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 bg-ivory p-4 sm:grid-cols-3">
      {initialValues?.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}
      {initialValues?.url && (
        <input type="hidden" name="existingUrl" defaultValue={initialValues.url} />
      )}
      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Photo
        <input
          name="file"
          type="file"
          accept="image/*"
          className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none file:mr-3 file:border-0 file:bg-burnt-orange file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ivory"
        />
        {initialValues?.url && (
          <span className="mt-1 flex items-center gap-2 text-[11px] text-foreground/50">
            <Image
              src={initialValues.url}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-cover"
            />
            Leave blank to keep the current photo
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Caption
        <input
          name="caption"
          defaultValue={initialValues?.caption}
          className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Order
        <input
          name="order"
          type="number"
          defaultValue={initialValues?.order ?? 0}
          className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-foreground/60 sm:col-span-3">
        <input
          name="showInHero"
          type="checkbox"
          defaultChecked={initialValues?.showInHero ?? false}
          className="h-4 w-4 border border-olive/20"
        />
        Show in Hero section
      </label>

      {state?.error && <p className="text-xs text-burnt-orange sm:col-span-3">{state.error}</p>}

      <div className="flex gap-2 sm:col-span-3">
        <button
          type="button"
          onClick={onCancel}
          className="border border-olive/30 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-burnt-orange hover:text-burnt-orange"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="bg-burnt-orange px-4 py-2 text-xs font-medium text-ivory transition-colors hover:bg-burnt-orange-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function StoryPhotosSection({ photos }: { photos: StoryPhotoView[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const { confirm, confirmDialog } = useConfirm();
  const { run, isPending } = useActionPending();

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete this photo?",
      description: "This can't be undone.",
    });
    if (!ok) return;
    setDeleteError("");
    await run(id, "delete", async () => {
      try {
        await deleteStoryPhoto(id);
      } catch {
        setDeleteError("Couldn't delete that photo.");
      }
    });
  };

  return (
    <div className="mt-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-(family-name:--serif) text-2xl text-foreground">
          Story Photos
        </h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="bg-burnt-orange px-4 py-2 text-xs font-medium text-ivory hover:bg-burnt-orange-dark"
          >
            Add Photo
          </button>
        )}
      </div>
      <p className="mb-4 max-w-2xl text-sm text-foreground/60">
        All photos appear in the Our Story carousel. Photos tagged
        &ldquo;Show in Hero&rdquo; also appear as the decorative photos on the
        hero section (up to 3, by order) — the two are independent, so
        reordering the carousel won&apos;t change what shows in the hero.
      </p>

      {adding && (
        <div className="mb-5">
          <PhotoForm action={addStoryPhoto} onCancel={() => setAdding(false)} submitLabel="Add Photo" />
        </div>
      )}

      {deleteError && <p className="mb-3 text-xs text-burnt-orange">{deleteError}</p>}

      <div className="overflow-x-auto border border-olive/15">
        <table className="w-full min-w-150 text-left text-sm">
          <thead>
            <tr className="border-b border-olive/15 text-[11px] tracking-widest text-foreground/50 uppercase">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Photo URL</th>
              <th className="px-4 py-3 font-medium">Caption</th>
              <th className="px-4 py-3 font-medium">Hero</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {photos.map((photo) =>
              editingId === photo.id ? (
                <tr key={photo.id} className="border-b border-olive/10 last:border-0">
                  <td colSpan={5} className="p-0">
                    <PhotoForm
                      action={updateStoryPhoto}
                      initialValues={photo}
                      onCancel={() => setEditingId(null)}
                      submitLabel="Save Changes"
                    />
                  </td>
                </tr>
              ) : (
                <tr key={photo.id} className="border-b border-olive/10 last:border-0">
                  <td className="px-4 py-3 text-foreground/70">{photo.order}</td>
                  <td className="px-4 py-3 text-foreground/70">{photo.url}</td>
                  <td className="px-4 py-3 text-foreground">{photo.caption}</td>
                  <td className="px-4 py-3">
                    {photo.showInHero && (
                      <span className="bg-olive/10 px-2 py-1 text-[10px] tracking-widest text-olive uppercase">
                        Hero
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isPending(photo.id)}
                      onClick={() => setEditingId(photo.id)}
                      className="mr-3 text-xs text-foreground/60 hover:text-burnt-orange disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isPending(photo.id)}
                      onClick={() => handleDelete(photo.id)}
                      className="text-xs text-foreground/60 hover:text-burnt-orange disabled:opacity-60"
                    >
                      {isPending(photo.id, "delete") ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      {confirmDialog}
    </div>
  );
}

export default function StoryTab({
  story,
  photos,
}: {
  story: StoryContentView;
  photos: StoryPhotoView[];
}) {
  const [state, formAction, pending] = useActionState(saveStory, undefined);

  return (
    <div>
      <h2 className="mb-2 font-(family-name:--serif) text-2xl text-foreground">Our Story</h2>
      <p className="mb-6 max-w-2xl text-sm text-foreground/60">
        This content isn&apos;t guest-generated, so there&apos;s no approval step —
        whatever you save here appears immediately on the public landing page.
      </p>

      <form action={formAction} className="grid grid-cols-1 gap-4 lg:max-w-2xl">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Bride&apos;s name
            <input
              name="brideName"
              defaultValue={story.brideName}
              className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Groom&apos;s name
            <input
              name="groomName"
              defaultValue={story.groomName}
              className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Wedding date
            <input
              type="date"
              name="weddingDate"
              defaultValue={story.weddingDate}
              className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Wedding time
            <input
              type="time"
              name="weddingTime"
              defaultValue={story.weddingTime}
              className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          Contact email
          <input
            type="email"
            name="contactEmail"
            defaultValue={story.contactEmail ?? ""}
            placeholder="hello@example.com"
            className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Tagline
            <input
              name="tagline"
              defaultValue={story.tagline ?? ""}
              placeholder="A celebration of love"
              className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Venue / location
            <input
              name="location"
              defaultValue={story.location ?? ""}
              placeholder="The venue, city"
              className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          How we met
          <textarea
            rows={4}
            name="howWeMet"
            defaultValue={story.howWeMet ?? ""}
            placeholder="Tell your guests how your story began…"
            className="resize-none border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          What we love about each other
          <textarea
            rows={4}
            name="whatWeLove"
            defaultValue={story.whatWeLove ?? ""}
            placeholder="Share what makes your partner special…"
            className="resize-none border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          Groom&apos;s love note (to the bride)
          <textarea
            rows={4}
            name="groomNote"
            defaultValue={story.groomNote ?? ""}
            placeholder="A personal note from the groom…"
            className="resize-none border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          Bride&apos;s love note (to the groom)
          <textarea
            rows={4}
            name="brideNote"
            defaultValue={story.brideNote ?? ""}
            placeholder="A personal note from the bride…"
            className="resize-none border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          Cover / hero photo URL
          <input
            name="heroPhotoUrl"
            defaultValue={story.heroPhotoUrl ?? ""}
            placeholder="https://…"
            className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
          />
        </label>

        {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="self-start bg-burnt-orange px-6 py-2.5 text-xs font-medium text-ivory transition-colors hover:bg-burnt-orange-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : state?.success ? "Saved ✓" : "Save & Publish"}
        </button>
      </form>

      <StoryPhotosSection photos={photos} />
    </div>
  );
}
