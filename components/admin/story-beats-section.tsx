"use client";

import Image from "next/image";
import { canOptimizeImage } from "@/lib/image-src";
import { startTransition, useActionState, useEffect, useState } from "react";
import {
  addStoryBeat,
  createStoryBeatUploadUrl,
  deleteStoryBeat,
  moveStoryBeat,
  updateStoryBeat,
  type StoryBeatFormState,
} from "@/lib/actions/story-beats";
import { convertHeicToJpeg } from "@/lib/heic";
import { compressImage } from "@/lib/image-compress";
import { useConfirm } from "./use-confirm";
import { useAdminWeddingId } from "./wedding-context";
import { useActionPending } from "./use-action-pending";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SectionHeading } from "@/components/ui/section-heading";
import MoveButtons from "./move-buttons";
import { FIELD, FILE_INPUT, TEXT_ACTION } from "@/components/admin/form-styles";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type StoryBeatView = {
  id: string;
  year: string;
  title: string;
  text: string;
  photoUrl: string | null;
  order: number;
};

function BeatForm({
  action,
  initialValues,
  onCancel,
  submitLabel,
}: {
  action: (state: StoryBeatFormState, formData: FormData) => Promise<StoryBeatFormState>;
  initialValues?: StoryBeatView;
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
      const urlResult = await createStoryBeatUploadUrl(weddingId, file.name, file.type, file.size);
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

      formData.set("photoUrl", urlResult.publicUrl);
    }
    formData.delete("file");

    // Run the action as a transition: the dashboard keeps showing while the server
    // refreshes it, instead of dropping to the full-page loading screen (which looked
    // like a page reload and jumped back to the top).
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 bg-accent p-4 sm:grid-cols-2">
      {initialValues?.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}
      {initialValues?.photoUrl && (
        <input type="hidden" name="existingPhotoUrl" defaultValue={initialValues.photoUrl} />
      )}

      <Label className="flex-col items-stretch gap-1.5">
        Label (e.g. &ldquo;The Drawing&rdquo;)
        <Input
          name="year"
          defaultValue={initialValues?.year}
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

      <Label className="flex-col items-stretch gap-1.5 sm:col-span-2">
        Title
        <Input
          name="title"
          defaultValue={initialValues?.title}
        />
      </Label>

      <Label className="flex-col items-stretch gap-1.5 sm:col-span-2">
        Story text
        <Textarea
          name="text"
          rows={3}
          defaultValue={initialValues?.text}
          className="resize-none"
        />
      </Label>

      <Label className="flex-col items-stretch gap-1.5 sm:col-span-2">
        Photo (optional)
        <Input
          name="file"
          type="file"
          accept="image/*,.heic,.heif"
          className={cn(FIELD, FILE_INPUT)}
        />
        {initialValues?.photoUrl && (
          <span className="mt-1 flex items-center gap-2 text-[13px] text-muted-foreground">
            <Image
              src={initialValues.photoUrl} unoptimized={!canOptimizeImage(initialValues.photoUrl)}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-cover"
            />
            Leave blank to keep the current photo
          </span>
        )}
      </Label>

      {(uploadError || state?.error) && (
        <p className="text-[13px] text-destructive sm:col-span-2">{uploadError || state?.error}</p>
      )}

      <div className="flex gap-2 sm:col-span-2">
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

export default function StoryBeatsSection({ beats }: { beats: StoryBeatView[] }) {
  const weddingId = useAdminWeddingId();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const { confirm, confirmDialog } = useConfirm();
  const { run, isPending } = useActionPending();

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Remove this moment?",
      description: "This can't be undone.",
    });
    if (!ok) return;
    setDeleteError("");
    await run(id, "delete", async () => {
      try {
        await deleteStoryBeat(weddingId, id);
      } catch {
        setDeleteError("Couldn't remove that moment.");
      }
    });
  };

  const move = (id: string, direction: "up" | "down") => run(id, direction, () => moveStoryBeat(weddingId, id, direction));

  return (
    <section className="mt-12">
      <SectionHeading
        title="How we met: moments"
        description="These show as the timeline in your How we met section, in this order. Photos are optional."
        action={
          !adding && (
            <Button size="sm" onClick={() => setAdding(true)}>
              Add a moment
            </Button>
          )
        }
      />

      {adding && (
        <div className="mb-5">
          <BeatForm action={addStoryBeat.bind(null, weddingId)} onCancel={() => setAdding(false)} submitLabel="Add moment" />
        </div>
      )}

      {deleteError && (
        <div className="mb-3">
          <Notice tone="error">{deleteError}</Notice>
        </div>
      )}

      {beats.length === 0 && !adding ? (
        <EmptyState title="No moments yet" body="Add a few moments, like where you met or the proposal, to tell your story in order." />
      ) : (
        <ol className="flex flex-col gap-3">
          {beats.map((beat, index) =>
            editingId === beat.id ? (
              <li key={beat.id}>
                <BeatForm
                  action={updateStoryBeat.bind(null, weddingId)}
                  initialValues={beat}
                  onCancel={() => setEditingId(null)}
                  submitLabel="Save changes"
                />
              </li>
            ) : (
              <li key={beat.id} className="flex items-center gap-4 rounded-[8px] border border-border bg-card p-3">
                {beat.photoUrl ? (
                  <Image src={beat.photoUrl} unoptimized={!canOptimizeImage(beat.photoUrl)} alt="" width={56} height={56} className="size-14 shrink-0 rounded-[6px] object-cover" />
                ) : (
                  <span className="size-14 shrink-0 rounded-[6px] bg-accent" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-muted-foreground">{beat.year}</p>
                  <p className="font-semibold text-ink">{beat.title}</p>
                  {beat.text && <p className="truncate text-[13px] text-muted-foreground">{beat.text}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <MoveButtons
                    name={beat.title}
                    first={index === 0}
                    last={index === beats.length - 1}
                    disabled={isPending(beat.id)}
                    onMove={(direction) => move(beat.id, direction)}
                  />
                  <Button size="xs" variant="link" className={cn(TEXT_ACTION, "ml-2")} disabled={isPending(beat.id)} onClick={() => setEditingId(beat.id)}>
                    Edit
                  </Button>
                  <Button size="xs" variant="link" className={cn(TEXT_ACTION, "ml-3")} disabled={isPending(beat.id)} onClick={() => handleDelete(beat.id)}>
                    {isPending(beat.id, "delete") ? "Removing…" : "Remove"}
                  </Button>
                </div>
              </li>
            )
          )}
        </ol>
      )}
      {confirmDialog}
    </section>
  );
}
