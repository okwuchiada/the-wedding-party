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
  moveStoryPhoto,
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
import { useSuccessToast } from "@/components/ui/toast";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PhoneField, TextArea, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SectionHeading } from "@/components/ui/section-heading";
import MoveButtons from "./move-buttons";
import { FIELD, FILE_INPUT, TEXT_ACTION } from "@/components/admin/form-styles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 bg-accent p-4 sm:grid-cols-3">
      {initialValues?.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}
      {initialValues?.url && (
        <input type="hidden" name="existingUrl" defaultValue={initialValues.url} />
      )}
      <Label className="flex-col items-stretch gap-1.5">
        Photo
        <Input
          name="file"
          type="file"
          accept="image/*,.heic,.heif"
          className={cn(FIELD, FILE_INPUT)}
        />
        {initialValues?.url && (
          <span className="mt-1 flex items-center gap-2 text-[13px] text-muted-foreground">
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
      </Label>
      <Label className="flex-col items-stretch gap-1.5">
        Caption
        <Input
          name="caption"
          defaultValue={initialValues?.caption}
        />
      </Label>
      <Label className="flex-col items-stretch gap-1.5">
        Order
        <Input
          name="order"
          type="number"
          defaultValue={initialValues?.order ?? 0}
        />
      </Label>

      <Label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-3">
        <Checkbox name="showInHero" defaultChecked={initialValues?.showInHero ?? false} />
        Show in Hero section
      </Label>

      {(uploadError || state?.error) && (
        <p className="text-[13px] text-destructive sm:col-span-3">{uploadError || state?.error}</p>
      )}

      <div className="flex gap-2 sm:col-span-3">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          size="sm"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={pending || uploading}
          size="sm"
        >
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
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        variant="outline"
        size="sm"
      >
        {uploading ? `Uploading ${progress.done}/${progress.total}…` : "Upload several"}
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
      {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}
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
      title: "Remove this photo?",
      description: "This can't be undone.",
    });
    if (!ok) return;
    setDeleteError("");
    await run(id, "delete", async () => {
      try {
        await deleteStoryPhoto(weddingId, id);
      } catch {
        setDeleteError("Couldn't remove that photo.");
      }
    });
  };

  const move = (id: string, direction: "up" | "down") => run(id, direction, () => moveStoryPhoto(weddingId, id, direction));

  return (
    <section className="mt-12">
      <SectionHeading
        title="Story photos"
        description="All of these appear in your Our story carousel, in this order. Photos marked Cover also appear beside your names at the top of the site (up to 3)."
        action={
          <>
            <BulkUploadButton />
            {!adding && (
              <Button size="sm" onClick={() => setAdding(true)}>
                Add a photo
              </Button>
            )}
          </>
        }
      />

      {adding && (
        <div className="mb-5">
          <PhotoForm action={addStoryPhoto.bind(null, weddingId)} onCancel={() => setAdding(false)} submitLabel="Add photo" />
        </div>
      )}

      {deleteError && (
        <div className="mb-3">
          <Notice tone="error">{deleteError}</Notice>
        </div>
      )}

      {editingId && (
        <div className="mb-5">
          <PhotoForm
            action={updateStoryPhoto.bind(null, weddingId)}
            initialValues={photos.find((p) => p.id === editingId)}
            onCancel={() => setEditingId(null)}
            submitLabel="Save changes"
          />
        </div>
      )}

      {photos.length === 0 && !adding ? (
        <EmptyState title="No photos yet" body="Add a few photos of the two of you. Upload several at once if you like." />
      ) : (
        <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {photos.map((photo, index) => (
            <li key={photo.id} className={`overflow-hidden rounded-[8px] border bg-card ${editingId === photo.id ? "border-ink" : "border-border"}`}>
              <div className="relative aspect-square bg-accent">
                <Image src={photo.url} unoptimized={!canOptimizeImage(photo.url)} alt={photo.caption || `Story photo ${index + 1}`} fill sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw" className="object-cover" />
                {photo.showInHero && (
                  <span className="absolute top-2 left-2 rounded-full bg-ink/80 px-2 py-0.5 text-[13px] font-semibold text-paper">Cover</span>
                )}
              </div>
              <div className="flex flex-col gap-1 p-2">
                {photo.caption && <p className="truncate text-[13px] text-muted-foreground">{photo.caption}</p>}
                <div className="flex items-center justify-between">
                  <MoveButtons
                    name={photo.caption || `photo ${index + 1}`}
                    first={index === 0}
                    last={index === photos.length - 1}
                    disabled={isPending(photo.id)}
                    onMove={(direction) => move(photo.id, direction)}
                  />
                  <span className="flex gap-2">
                    <Button size="xs" className={TEXT_ACTION} variant="link" disabled={isPending(photo.id)} onClick={() => setEditingId(photo.id)}>
                      Edit
                    </Button>
                    <Button size="xs" className={TEXT_ACTION} variant="link" disabled={isPending(photo.id)} onClick={() => handleDelete(photo.id)}>
                      {isPending(photo.id, "delete") ? "Removing…" : "Remove"}
                    </Button>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      {confirmDialog}
    </section>
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
  useSuccessToast(state, "Story saved");
  // Held in state so the pickers keep their values through React's post-save form reset.
  const [weddingDate, setWeddingDate] = useState(story.weddingDate);
  const [weddingTime, setWeddingTime] = useState(story.weddingTime);

  return (
    <div>
      <SectionHeading title="Our story" description="Changes here show on your site as soon as you save." />

      <form action={formAction} className="flex flex-col gap-5 lg:max-w-3xl">
        <Card className="gap-0 rounded-md p-5 shadow-none block">
          <SectionHeading as="h3" title="The basics" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput label="First partner's name" name="brideName" defaultValue={story.brideName} required />
            <TextInput label="Second partner's name" name="groomName" defaultValue={story.groomName} required />
            <div className="sm:col-span-2">
              <TextInput label="Tagline" name="tagline" defaultValue={story.tagline ?? ""} placeholder="A celebration of love" hint="A short line shown near your names." />
            </div>
          </div>
        </Card>

        <Card className="gap-0 rounded-md p-5 shadow-none block">
          <SectionHeading as="h3" title="When and where" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              <span id="story-date-label">Wedding date</span>
              <DatePicker name="weddingDate" value={weddingDate} onChange={setWeddingDate} labelledBy="story-date-label" />
            </div>
            <div className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              <span id="story-time-label">Wedding time</span>
              <TimePicker name="weddingTime" value={weddingTime} onChange={setWeddingTime} labelledBy="story-time-label" />
            </div>
            <div className="sm:col-span-2">
              <TextInput label="Venue or city" name="location" defaultValue={story.location ?? ""} placeholder="The venue, city" hint="Shown on your site." />
            </div>
            <div className="sm:col-span-2">
              <TextInput
                label="Full venue address"
                name="venueAddress"
                defaultValue={story.venueAddress ?? ""}
                placeholder="123 Main Street, Victoria Island, Lagos"
                hint="Only sent to guests who say yes, in their confirmation email."
              />
            </div>
          </div>
        </Card>

        <Card className="gap-0 rounded-md p-5 shadow-none block">
          <SectionHeading as="h3" title="Your story" />
          <div className="flex flex-col gap-4">
            <TextArea label="How you met" name="howWeMet" rows={4} defaultValue={story.howWeMet ?? ""} placeholder="Tell your guests how your story began" className="resize-y" />
            <TextArea label="What you love about each other" name="whatWeLove" rows={4} defaultValue={story.whatWeLove ?? ""} className="resize-y" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextArea label="First partner's love note" name="brideNote" rows={4} defaultValue={story.brideNote ?? ""} hint="To the second partner." className="resize-y" />
              <TextArea label="Second partner's love note" name="groomNote" rows={4} defaultValue={story.groomNote ?? ""} hint="To the first partner." className="resize-y" />
            </div>
            <TextInput label="Cover photo link" name="heroPhotoUrl" type="url" defaultValue={story.heroPhotoUrl ?? ""} placeholder="https://" hint="The large photo at the top of your site." />
          </div>
        </Card>

        <Card className="gap-0 rounded-md p-5 shadow-none block">
          <SectionHeading as="h3" title="Contact" description="Guests use these to reach you. The first partner's phone is also used for the asoebi WhatsApp button." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextInput label="Contact email" name="contactEmail" type="email" defaultValue={story.contactEmail ?? ""} placeholder="hello@example.com" />
            </div>
            <PhoneField label="First partner's phone" name="bridePhone" defaultValue={story.bridePhone ?? ""} placeholder="+234…" />
            <PhoneField label="Second partner's phone" name="groomPhone" defaultValue={story.groomPhone ?? ""} placeholder="+234…" />
          </div>
        </Card>

        {state?.error && <Notice tone="error">{state.error}</Notice>}

        <Button type="submit" size="lg" className="self-start" disabled={pending}>

          {pending ? "Saving…" : "Save story"}

        </Button>
      </form>

      <StoryPhotosSection photos={photos} />
      <StoryBeatsSection beats={storyBeats} />
    </div>
  );
}
