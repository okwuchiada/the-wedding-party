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
import { useConfirm } from "./use-confirm";
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
      const file = await convertHeicToJpeg(rawFile);
      const urlResult = await createStoryBeatUploadUrl(file.name, file.type, file.size);
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

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60 sm:col-span-2">
        Title
        <input
          name="title"
          defaultValue={initialValues?.title}
          className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60 sm:col-span-2">
        Story text
        <textarea
          name="text"
          rows={3}
          defaultValue={initialValues?.text}
          className="resize-none border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-xs text-foreground/60 sm:col-span-2">
        Photo (optional)
        <input
          name="file"
          type="file"
          accept="image/*,.heic,.heif"
          className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground outline-none file:mr-3 file:border-0 file:bg-burnt-orange file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ivory"
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
          className="border border-olive/30 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-burnt-orange hover:text-burnt-orange"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || uploading}
          className="bg-burnt-orange px-4 py-2 text-xs font-medium text-ivory transition-colors hover:bg-burnt-orange-dark disabled:opacity-60"
        >
          {uploading ? "Uploading…" : pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function StoryBeatsSection({ beats }: { beats: StoryBeatView[] }) {
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
        await deleteStoryBeat(id);
      } catch {
        setDeleteError("Couldn't delete that beat.");
      }
    });
  };

  return (
    <div className="mt-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-(family-name:--serif) text-2xl text-foreground">
          How We Met Timeline
        </h2>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="bg-burnt-orange px-4 py-2 text-xs font-medium text-ivory hover:bg-burnt-orange-dark"
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
          <BeatForm action={addStoryBeat} onCancel={() => setAdding(false)} submitLabel="Add Beat" />
        </div>
      )}

      {deleteError && <p className="mb-3 text-xs text-burnt-orange">{deleteError}</p>}

      <div className="overflow-x-auto border border-olive/15">
        <table className="w-full min-w-150 text-left text-sm">
          <thead>
            <tr className="border-b border-olive/15 text-[11px] tracking-widest text-foreground/50 uppercase">
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
                <tr key={beat.id} className="border-b border-olive/10 last:border-0">
                  <td colSpan={5} className="p-0">
                    <BeatForm
                      action={updateStoryBeat}
                      initialValues={beat}
                      onCancel={() => setEditingId(null)}
                      submitLabel="Save Changes"
                    />
                  </td>
                </tr>
              ) : (
                <tr key={beat.id} className="border-b border-olive/10 last:border-0">
                  <td className="px-4 py-3 text-foreground/70">{beat.order}</td>
                  <td className="px-4 py-3 text-foreground/70">{beat.year}</td>
                  <td className="px-4 py-3 text-foreground">{beat.title}</td>
                  <td className="px-4 py-3">
                    {beat.photoUrl ? (
                      <span className="bg-olive/10 px-2 py-1 text-[10px] tracking-widest text-olive uppercase">
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
