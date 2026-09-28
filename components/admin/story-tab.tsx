"use client";

import Image from "next/image";
import { canOptimizeImage } from "@/lib/image-src";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { saveStory } from "@/lib/actions/story";
import {
  addStoryPhoto,
  bulkAddStoryPhotos,
  createStoryPhotoUploadUrl,
  deleteStoryPhoto,
  updateStoryPhoto,
  type StoryPhotoFormState,
} from "@/lib/actions/story-photos";
import { convertHeicToJpeg, isImageFile } from "@/lib/heic";
import { compressImage } from "@/lib/image-compress";
import { useConfirm } from "./use-confirm";
import DatePicker from "@/components/marketing/date-picker";
import TimePicker from "@/components/marketing/time-picker";
import { useAdminWeddingId } from "./wedding-context";
import { useActionPending } from "./use-action-pending";
import StoryBeatsSection, { type StoryBeatView } from "./story-beats-section";

export type StoryContentView = {
  brideName: string;
  groomName: string;
  weddingDate: string;
  weddingTime: string;
  tagline: string | null;
  location: string | null;
  venueAddress: string | null;
  howWeMet: string | null;
  whatWeLove: string | null;
  groomNote: string | null;
  brideNote: string | null;
  heroPhotoUrl: string | null;
  contactEmail: string | null;
  bridePhone: string | null;
  groomPhone: string | null;
  galleryEnabled: boolean;
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
  const weddingId = useAdminWeddingId();
  const [state, formAction, pending] = useActionState(action, undefined);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (state?.success) onCancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError("");

    const formData = new FormData(e.currentTarget);
    const rawFile = formData.get("file");

    if (rawFile instanceof File && rawFile.size > 0) {
      setUploading(true);
      const file = await compressImage(await convertHeicToJpeg(rawFile));
      const urlResult = await createStoryPhotoUploadUrl(weddingId, file.name, file.type, file.size);
      if (!urlResult || urlResult.error || !urlResult.uploadUrl || !urlResult.publicUrl) {
        setUploading(false);
        setUploadError(urlResult?.error ?? "Upload failed. Please try again.");
        return;
      }

      const putResponse = await fetch(urlResult.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      setUploading(false);

      if (!putResponse.ok) {
        setUploadError("Upload failed. Please try again.");
        return;
      }

      formData.set("url", urlResult.publicUrl);
    }
    formData.delete("file");

    // Run the action as a transition: the dashboard keeps showing while the server
    // refreshes it, instead of dropping to the full-page loading screen (which looked
    // like a page reload and jumped back to the top).
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 bg-ivory p-4 sm:grid-cols-3">
      {initialValues?.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}
      {initialValues?.url && (
        <input type="hidden" name="existingUrl" defaultValue={initialValues.url} />
      )}
      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Photo
        <input
          name="file"
          type="file"
          accept="image/*,.heic,.heif"
          className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none file:mr-3 file:border-0 file:rounded-full file:bg-(--m-ink) file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ivory"
        />
        {initialValues?.url && (
          <span className="mt-1 flex items-center gap-2 text-[11px] text-foreground/50">
            <Image
              src={initialValues.url} unoptimized={!canOptimizeImage(initialValues.url)}
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
          className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Order
        <input
          name="order"
          type="number"
          defaultValue={initialValues?.order ?? 0}
          className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-foreground/60 sm:col-span-3">
        <input
          name="showInHero"
          type="checkbox"
          defaultChecked={initialValues?.showInHero ?? false}
          className="h-4 w-4 border border-(--m-mist)"
        />
        Show in Hero section
      </label>

      {(uploadError || state?.error) && (
        <p className="text-xs text-burnt-orange sm:col-span-3">{uploadError || state?.error}</p>
      )}

      <div className="flex gap-2 sm:col-span-3">
        <button
          type="button"
          onClick={onCancel}
          className="border rounded-full border-(--m-ink)/25 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-(--m-ink)"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || uploading}
          className="rounded-full bg-(--m-gold) px-4 py-2 text-xs font-semibold text-(--m-ink) transition-colors hover:bg-(--m-ink) hover:text-(--m-paper) disabled:opacity-60"
        >
          {uploading ? "Uploading…" : pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function BulkUploadButton() {
  const weddingId = useAdminWeddingId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError("");

    const files = Array.from(fileList);
    setUploading(true);
    setProgress({ done: 0, total: files.length });

    const urls: string[] = [];

    for (const rawFile of files) {
      if (!isImageFile(rawFile)) {
        setError(`${rawFile.name} isn't an image — skipped`);
        continue;
      }

      const file = await compressImage(await convertHeicToJpeg(rawFile));
      const urlResult = await createStoryPhotoUploadUrl(weddingId, file.name, file.type, file.size);
      if (!urlResult || urlResult.error || !urlResult.uploadUrl || !urlResult.publicUrl) {
        setError(urlResult?.error ?? `Couldn't upload ${file.name}`);
        continue;
      }

      const putResponse = await fetch(urlResult.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putResponse.ok) {
        setError(`Couldn't upload ${file.name}`);
        continue;
      }

      urls.push(urlResult.publicUrl);
      setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }

    if (urls.length > 0) {
      const result = await bulkAddStoryPhotos(weddingId, urls);
      if (result?.error) setError(result.error);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="border rounded-full border-(--m-ink)/25 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-(--m-ink) disabled:opacity-60"
      >
        {uploading ? `Uploading ${progress.done}/${progress.total}…` : "Bulk Upload"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
        }}
      />
      {error && <p className="mt-2 text-xs text-burnt-orange">{error}</p>}
    </div>
  );
}

function StoryPhotosSection({ photos }: { photos: StoryPhotoView[] }) {
  const weddingId = useAdminWeddingId();
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
        await deleteStoryPhoto(weddingId, id);
      } catch {
        setDeleteError("Couldn't delete that photo.");
      }
    });
  };

  return (
    <div className="mt-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">
          Story Photos
        </h2>
        <div className="flex gap-2">
          <BulkUploadButton />
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-full bg-(--m-gold) px-4 py-2 text-xs font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper)"
            >
              Add Photo
            </button>
          )}
        </div>
      </div>
      <p className="mb-4 max-w-2xl text-sm text-foreground/60">
        Bulk-uploaded photos are added with no caption and appear at the end
        of the order — use Edit to add a caption or reorder them. All photos
        appear in the Our Story carousel. Photos tagged
        &ldquo;Show in Hero&rdquo; also appear as the decorative photos on the
        hero section (up to 3, by order) — the two are independent, so
        reordering the carousel won&apos;t change what shows in the hero.
      </p>

      {adding && (
        <div className="mb-5">
          <PhotoForm action={addStoryPhoto.bind(null, weddingId)} onCancel={() => setAdding(false)} submitLabel="Add Photo" />
        </div>
      )}

      {deleteError && <p className="mb-3 text-xs text-burnt-orange">{deleteError}</p>}

      <div className="overflow-x-auto rounded-[6px] border border-(--m-mist) bg-white">
        <table className="w-full min-w-150 text-left text-sm">
          <thead>
            <tr className="border-b border-(--m-mist) text-xs text-foreground/50">
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
                <tr key={photo.id} className="border-b border-(--m-mist) last:border-0">
                  <td colSpan={5} className="p-0">
                    <PhotoForm
                      action={updateStoryPhoto.bind(null, weddingId)}
                      initialValues={photo}
                      onCancel={() => setEditingId(null)}
                      submitLabel="Save Changes"
                    />
                  </td>
                </tr>
              ) : (
                <tr key={photo.id} className="border-b border-(--m-mist) last:border-0">
                  <td className="px-4 py-3 text-foreground/70">{photo.order}</td>
                  <td className="px-4 py-3 text-foreground/70">{photo.url}</td>
                  <td className="px-4 py-3 text-foreground">{photo.caption}</td>
                  <td className="px-4 py-3">
                    {photo.showInHero && (
                      <span className="bg-olive/10 px-2 py-1 text-xs text-olive">
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
  storyBeats,
}: {
  story: StoryContentView;
  photos: StoryPhotoView[];
  storyBeats: StoryBeatView[];
}) {
  const weddingId = useAdminWeddingId();
  const [state, formAction, pending] = useActionState(saveStory.bind(null, weddingId), undefined);
  // Held in state so the pickers keep their values through React's post-save form reset.
  const [weddingDate, setWeddingDate] = useState(story.weddingDate);
  const [weddingTime, setWeddingTime] = useState(story.weddingTime);

  return (
    <div>
      <h2 className="mb-2 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Our Story</h2>
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
              className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Groom&apos;s name
            <input
              name="groomName"
              defaultValue={story.groomName}
              className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 text-xs text-foreground/60">
            <span id="story-date-label">Wedding date</span>
            <DatePicker name="weddingDate" value={weddingDate} onChange={setWeddingDate} labelledBy="story-date-label" />
          </div>
          <div className="flex flex-col gap-1.5 text-xs text-foreground/60">
            <span id="story-time-label">Wedding time</span>
            <TimePicker name="weddingTime" value={weddingTime} onChange={setWeddingTime} labelledBy="story-time-label" />
          </div>
        </div>
        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          Contact email
          <input
            type="email"
            name="contactEmail"
            defaultValue={story.contactEmail ?? ""}
            placeholder="hello@example.com"
            className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Bride&apos;s RSVP number
            <input
              type="tel"
              name="bridePhone"
              defaultValue={story.bridePhone ?? ""}
              placeholder="+234…"
              className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Groom&apos;s RSVP number
            <input
              type="tel"
              name="groomPhone"
              defaultValue={story.groomPhone ?? ""}
              placeholder="+234…"
              className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Tagline
            <input
              name="tagline"
              defaultValue={story.tagline ?? ""}
              placeholder="A celebration of love"
              className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
            Venue / location
            <input
              name="location"
              defaultValue={story.location ?? ""}
              placeholder="The venue, city"
              className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          Full venue address (RSVP confirmation email only)
          <input
            name="venueAddress"
            defaultValue={story.venueAddress ?? ""}
            placeholder="123 Main Street, Victoria Island, Lagos"
            className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
          />
          <span className="text-[11px] text-foreground/45">
            Shown only to guests who RSVP as attending — the site itself keeps showing just
            &quot;Venue / location&quot; above.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          How we met
          <textarea
            rows={4}
            name="howWeMet"
            defaultValue={story.howWeMet ?? ""}
            placeholder="Tell your guests how your story began…"
            className="resize-none border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          What we love about each other
          <textarea
            rows={4}
            name="whatWeLove"
            defaultValue={story.whatWeLove ?? ""}
            placeholder="Share what makes your partner special…"
            className="resize-none border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          Groom&apos;s love note (to the bride)
          <textarea
            rows={4}
            name="groomNote"
            defaultValue={story.groomNote ?? ""}
            placeholder="A personal note from the groom…"
            className="resize-none border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          Bride&apos;s love note (to the groom)
          <textarea
            rows={4}
            name="brideNote"
            defaultValue={story.brideNote ?? ""}
            placeholder="A personal note from the bride…"
            className="resize-none border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
          Cover / hero photo URL
          <input
            name="heroPhotoUrl"
            defaultValue={story.heroPhotoUrl ?? ""}
            placeholder="https://…"
            className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
          />
        </label>

        {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-(--m-gold) px-6 py-2.5 text-sm font-semibold text-(--m-ink) transition-colors hover:bg-(--m-ink) hover:text-(--m-paper) disabled:opacity-60"
        >
          {pending ? "Saving…" : state?.success ? "Saved ✓" : "Save & Publish"}
        </button>
      </form>

      <StoryPhotosSection photos={photos} />
      <StoryBeatsSection beats={storyBeats} />
    </div>
  );
}
