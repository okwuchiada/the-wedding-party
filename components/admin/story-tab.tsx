"use client";

import Image from "next/image";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FIELD, FIELD_LABEL, FILE_INPUT, TEXT_ACTION } from "./form-styles";
import { Textarea } from "@/components/ui/textarea";

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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 bg-paper p-4 sm:grid-cols-3">
      {initialValues?.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}
      {initialValues?.url && (
        <input type="hidden" name="existingUrl" defaultValue={initialValues.url} />
      )}
      <Label className={FIELD_LABEL}>
        Photo
        <Input name="file" type="file" accept="image/*,.heic,.heif" className={cn(FIELD, FILE_INPUT)} />
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
      </Label>
      <Label className={FIELD_LABEL}>
        Caption
        <Input
          name="caption"
          defaultValue={initialValues?.caption}
          className={FIELD}
        />
      </Label>
      <Label className={FIELD_LABEL}>
        Order
        <Input
          name="order"
          type="number"
          defaultValue={initialValues?.order ?? 0}
          className={FIELD}
        />
      </Label>

      <Label className="text-xs font-normal text-ink/60 sm:col-span-3">
        <Checkbox name="showInHero" defaultChecked={initialValues?.showInHero ?? false} />
        Show in Hero section
      </Label>

      {(uploadError || state?.error) && (
        <p className="text-xs text-burnt-orange sm:col-span-3">{uploadError || state?.error}</p>
      )}

      <div className="flex gap-2 sm:col-span-3">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending || uploading}>
          {uploading ? "Uploading…" : pending ? "Saving…" : submitLabel}
        </Button>
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? `Uploading ${progress.done}/${progress.total}…` : "Bulk Upload"}
      </Button>
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
            <Button type="button" size="sm" onClick={() => setAdding(true)}>
              Add Photo
            </Button>
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

      <div className="overflow-hidden rounded-md border border-mist bg-white">
        <Table className="min-w-150">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 text-ink/50">Order</TableHead>
              <TableHead className="px-4 py-3 text-ink/50">Photo URL</TableHead>
              <TableHead className="px-4 py-3 text-ink/50">Caption</TableHead>
              <TableHead className="px-4 py-3 text-ink/50">Hero</TableHead>
              <TableHead className="px-4 py-3 text-ink/50">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {photos.map((photo) =>
              editingId === photo.id ? (
                <TableRow key={photo.id}>
                  <TableCell colSpan={5} className="p-0">
                    <PhotoForm
                      action={updateStoryPhoto.bind(null, weddingId)}
                      initialValues={photo}
                      onCancel={() => setEditingId(null)}
                      submitLabel="Save Changes"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={photo.id}>
                  <TableCell className="px-4 py-3 text-ink/70">{photo.order}</TableCell>
                  <TableCell className="px-4 py-3 text-ink/70">{photo.url}</TableCell>
                  <TableCell className="px-4 py-3 text-ink">{photo.caption}</TableCell>
                  <TableCell className="px-4 py-3">
                    {photo.showInHero && (
                      <span className="bg-olive/10 px-2 py-1 text-xs text-olive">
                        Hero
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      disabled={isPending(photo.id)}
                      onClick={() => setEditingId(photo.id)}
                      className={cn(TEXT_ACTION, "mr-3")}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      disabled={isPending(photo.id)}
                      onClick={() => handleDelete(photo.id)}
                      className={TEXT_ACTION}
                    >
                      {isPending(photo.id, "delete") ? "Deleting…" : "Delete"}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
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
          <Label className={FIELD_LABEL}>
            Bride&apos;s name
            <Input
              name="brideName"
              defaultValue={story.brideName}
              className={FIELD}
            />
          </Label>
          <Label className={FIELD_LABEL}>
            Groom&apos;s name
            <Input
              name="groomName"
              defaultValue={story.groomName}
              className={FIELD}
            />
          </Label>
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
        <Label className={FIELD_LABEL}>
          Contact email
          <Input
            type="email"
            name="contactEmail"
            defaultValue={story.contactEmail ?? ""}
            placeholder="hello@example.com"
            className={FIELD}
          />
        </Label>

        <div className="grid grid-cols-2 gap-3">
          <Label className={FIELD_LABEL}>
            Bride&apos;s RSVP number
            <Input
              type="tel"
              name="bridePhone"
              defaultValue={story.bridePhone ?? ""}
              placeholder="+234…"
              className={FIELD}
            />
          </Label>
          <Label className={FIELD_LABEL}>
            Groom&apos;s RSVP number
            <Input
              type="tel"
              name="groomPhone"
              defaultValue={story.groomPhone ?? ""}
              placeholder="+234…"
              className={FIELD}
            />
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Label className={FIELD_LABEL}>
            Tagline
            <Input
              name="tagline"
              defaultValue={story.tagline ?? ""}
              placeholder="A celebration of love"
              className={FIELD}
            />
          </Label>
          <Label className={FIELD_LABEL}>
            Venue / location
            <Input
              name="location"
              defaultValue={story.location ?? ""}
              placeholder="The venue, city"
              className={FIELD}
            />
          </Label>
        </div>

        <Label className={FIELD_LABEL}>
          Full venue address (RSVP confirmation email only)
          <Input
            name="venueAddress"
            defaultValue={story.venueAddress ?? ""}
            placeholder="123 Main Street, Victoria Island, Lagos"
            className={FIELD}
          />
          <span className="text-[11px] text-foreground/45">
            Shown only to guests who RSVP as attending — the site itself keeps showing just
            &quot;Venue / location&quot; above.
          </span>
        </Label>

        <Label className={FIELD_LABEL}>
          How we met
          <Textarea
            rows={4}
            name="howWeMet"
            defaultValue={story.howWeMet ?? ""}
            placeholder="Tell your guests how your story began…"
            className={cn(FIELD, "field-sizing-fixed resize-none")}
          />
        </Label>

        <Label className={FIELD_LABEL}>
          What we love about each other
          <Textarea
            rows={4}
            name="whatWeLove"
            defaultValue={story.whatWeLove ?? ""}
            placeholder="Share what makes your partner special…"
            className={cn(FIELD, "field-sizing-fixed resize-none")}
          />
        </Label>

        <Label className={FIELD_LABEL}>
          Groom&apos;s love note (to the bride)
          <Textarea
            rows={4}
            name="groomNote"
            defaultValue={story.groomNote ?? ""}
            placeholder="A personal note from the groom…"
            className={cn(FIELD, "field-sizing-fixed resize-none")}
          />
        </Label>

        <Label className={FIELD_LABEL}>
          Bride&apos;s love note (to the groom)
          <Textarea
            rows={4}
            name="brideNote"
            defaultValue={story.brideNote ?? ""}
            placeholder="A personal note from the bride…"
            className={cn(FIELD, "field-sizing-fixed resize-none")}
          />
        </Label>

        <Label className={FIELD_LABEL}>
          Cover / hero photo URL
          <Input
            name="heroPhotoUrl"
            defaultValue={story.heroPhotoUrl ?? ""}
            placeholder="https://…"
            className={FIELD}
          />
        </Label>

        {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}

        <Button type="submit" size="lg" disabled={pending} className="self-start">
          {pending ? "Saving…" : state?.success ? "Saved ✓" : "Save & Publish"}
        </Button>
      </form>

      <StoryPhotosSection photos={photos} />
      <StoryBeatsSection beats={storyBeats} />
    </div>
  );
}
