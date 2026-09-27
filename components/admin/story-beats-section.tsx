"use client";

import Image from "next/image";
import { startTransition, useActionState, useEffect, useState } from "react";
import {
  addStoryBeat,
  createStoryBeatUploadUrl,
  deleteStoryBeat,
  updateStoryBeat,
  type StoryBeatFormState,
} from "@/lib/actions/story-beats";
import { convertHeicToJpeg } from "@/lib/heic";
import { compressImage } from "@/lib/image-compress";
import { useConfirm } from "./use-confirm";
import { useAdminWeddingId } from "./wedding-context";
import { useActionPending } from "./use-action-pending";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FIELD, FIELD_LABEL, FILE_INPUT, TEXT_ACTION } from "./form-styles";
import { Textarea } from "@/components/ui/textarea";

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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 bg-ivory p-4 sm:grid-cols-2">
      {initialValues?.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}
      {initialValues?.photoUrl && (
        <input type="hidden" name="existingPhotoUrl" defaultValue={initialValues.photoUrl} />
      )}

      <Label className={FIELD_LABEL}>
        Label (e.g. &ldquo;The Drawing&rdquo;)
        <Input
          name="year"
          defaultValue={initialValues?.year}
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

      <Label className={cn(FIELD_LABEL, "sm:col-span-2")}>
        Title
        <Input
          name="title"
          defaultValue={initialValues?.title}
          className={FIELD}
        />
      </Label>

      <Label className={cn(FIELD_LABEL, "sm:col-span-2")}>
        Story text
        <Textarea
          name="text"
          rows={3}
          defaultValue={initialValues?.text}
          className={cn(FIELD, "field-sizing-fixed resize-none")}
        />
      </Label>

      <Label className={cn(FIELD_LABEL, "sm:col-span-2")}>
        Photo (optional)
        <Input
          name="file"
          type="file"
          accept="image/*,.heic,.heif"
          className={cn(FIELD, FILE_INPUT)}
        />
        {initialValues?.photoUrl && (
          <span className="mt-1 flex items-center gap-2 text-[11px] text-foreground/50">
            <Image
              src={initialValues.photoUrl}
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
        <p className="text-xs text-burnt-orange sm:col-span-2">{uploadError || state?.error}</p>
      )}

      <div className="flex gap-2 sm:col-span-2">
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

export default function StoryBeatsSection({ beats }: { beats: StoryBeatView[] }) {
  const weddingId = useAdminWeddingId();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const { confirm, confirmDialog } = useConfirm();
  const { run, isPending } = useActionPending();

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete this beat?",
      description: "This can't be undone.",
    });
    if (!ok) return;
    setDeleteError("");
    await run(id, "delete", async () => {
      try {
        await deleteStoryBeat(weddingId, id);
      } catch {
        setDeleteError("Couldn't delete that beat.");
      }
    });
  };

  return (
    <div className="mt-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">
          How We Met Timeline
        </h2>
        {!adding && (
          <Button type="button" size="sm" onClick={() => setAdding(true)}>
            Add Beat
          </Button>
        )}
      </div>
      <p className="mb-4 max-w-2xl text-sm text-foreground/60">
        These appear as the alternating timeline on the public &ldquo;How We
        Met&rdquo; section, in order. Photos are optional — beats without one
        show a placeholder.
      </p>

      {adding && (
        <div className="mb-5">
          <BeatForm action={addStoryBeat.bind(null, weddingId)} onCancel={() => setAdding(false)} submitLabel="Add Beat" />
        </div>
      )}

      {deleteError && <p className="mb-3 text-xs text-burnt-orange">{deleteError}</p>}

      <div className="overflow-hidden rounded-md border border-mist bg-white">
        <Table className="min-w-150">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 text-ink/50">Order</TableHead>
              <TableHead className="px-4 py-3 text-ink/50">Label</TableHead>
              <TableHead className="px-4 py-3 text-ink/50">Title</TableHead>
              <TableHead className="px-4 py-3 text-ink/50">Photo</TableHead>
              <TableHead className="px-4 py-3 text-ink/50">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {beats.map((beat) =>
              editingId === beat.id ? (
                <TableRow key={beat.id}>
                  <TableCell colSpan={5} className="p-0">
                    <BeatForm
                      action={updateStoryBeat.bind(null, weddingId)}
                      initialValues={beat}
                      onCancel={() => setEditingId(null)}
                      submitLabel="Save Changes"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={beat.id}>
                  <TableCell className="px-4 py-3 text-ink/70">{beat.order}</TableCell>
                  <TableCell className="px-4 py-3 text-ink/70">{beat.year}</TableCell>
                  <TableCell className="px-4 py-3 text-ink">{beat.title}</TableCell>
                  <TableCell className="px-4 py-3">
                    {beat.photoUrl ? (
                      <span className="bg-olive/10 px-2 py-1 text-xs text-olive">
                        Yes
                      </span>
                    ) : (
                      <span className="text-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      disabled={isPending(beat.id)}
                      onClick={() => setEditingId(beat.id)}
                      className={cn(TEXT_ACTION, "mr-3")}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      disabled={isPending(beat.id)}
                      onClick={() => handleDelete(beat.id)}
                      className={TEXT_ACTION}
                    >
                      {isPending(beat.id, "delete") ? "Deleting…" : "Delete"}
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
