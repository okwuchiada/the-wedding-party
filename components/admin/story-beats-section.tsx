"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
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

    formAction(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 bg-ivory p-4 sm:grid-cols-2">
      {initialValues?.id && <input type="hidden" name="id" defaultValue={initialValues.id} />}
      {initialValues?.photoUrl && (
        <input type="hidden" name="existingPhotoUrl" defaultValue={initialValues.photoUrl} />
      )}

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60">
        Label (e.g. &ldquo;The Drawing&rdquo;)
        <input
          name="year"
          defaultValue={initialValues?.year}
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

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60 sm:col-span-2">
        Title
        <input
          name="title"
          defaultValue={initialValues?.title}
          className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60 sm:col-span-2">
        Story text
        <textarea
          name="text"
          rows={3}
          defaultValue={initialValues?.text}
          className="resize-none border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60 sm:col-span-2">
        Photo (optional)
        <input
          name="file"
          type="file"
          accept="image/*,.heic,.heif"
          className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground outline-none file:mr-3 file:border-0 file:rounded-full file:bg-(--m-ink) file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ivory"
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
      </label>

      {(uploadError || state?.error) && (
        <p className="text-xs text-burnt-orange sm:col-span-2">{uploadError || state?.error}</p>
      )}

      <div className="flex gap-2 sm:col-span-2">
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
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full bg-(--m-gold) px-4 py-2 text-xs font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper)"
          >
            Add Beat
          </button>
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

      <div className="overflow-x-auto rounded-[6px] border border-(--m-mist) bg-white">
        <table className="w-full min-w-150 text-left text-sm">
          <thead>
            <tr className="border-b border-(--m-mist) text-xs text-foreground/50">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Photo</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {beats.map((beat) =>
              editingId === beat.id ? (
                <tr key={beat.id} className="border-b border-(--m-mist) last:border-0">
                  <td colSpan={5} className="p-0">
                    <BeatForm
                      action={updateStoryBeat.bind(null, weddingId)}
                      initialValues={beat}
                      onCancel={() => setEditingId(null)}
                      submitLabel="Save Changes"
                    />
                  </td>
                </tr>
              ) : (
                <tr key={beat.id} className="border-b border-(--m-mist) last:border-0">
                  <td className="px-4 py-3 text-foreground/70">{beat.order}</td>
                  <td className="px-4 py-3 text-foreground/70">{beat.year}</td>
                  <td className="px-4 py-3 text-foreground">{beat.title}</td>
                  <td className="px-4 py-3">
                    {beat.photoUrl ? (
                      <span className="bg-olive/10 px-2 py-1 text-xs text-olive">
                        Yes
                      </span>
                    ) : (
                      <span className="text-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isPending(beat.id)}
                      onClick={() => setEditingId(beat.id)}
                      className="mr-3 text-xs text-foreground/60 hover:text-burnt-orange disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isPending(beat.id)}
                      onClick={() => handleDelete(beat.id)}
                      className="text-xs text-foreground/60 hover:text-burnt-orange disabled:opacity-60"
                    >
                      {isPending(beat.id, "delete") ? "Deleting…" : "Delete"}
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
