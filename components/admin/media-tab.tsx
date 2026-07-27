"use client";

import Image from "next/image";
import type { ApprovedMediaView, HiddenMediaView, PendingMediaView } from "@/lib/types";
import { useConfirm } from "./use-confirm";
import { useActionPending } from "./use-action-pending";

export default function MediaTab({
  pending,
  approved,
  hidden,
  galleryEnabled,
  onApprove,
  onHide,
  onHideApproved,
  onDeleteApproved,
  onRestore,
  onToggleGallery,
}: {
  pending: PendingMediaView[];
  approved: ApprovedMediaView[];
  hidden: HiddenMediaView[];
  galleryEnabled: boolean;
  onApprove: (media: PendingMediaView) => Promise<void>;
  onHide: (media: PendingMediaView) => Promise<void>;
  onHideApproved: (media: ApprovedMediaView) => Promise<void>;
  onDeleteApproved: (media: ApprovedMediaView) => Promise<void>;
  onRestore: (media: HiddenMediaView) => Promise<void>;
  onToggleGallery: () => Promise<void>;
}) {
  const { confirm, confirmDialog } = useConfirm();
  const { run, isPending } = useActionPending();

  const handleDeleteApproved = async (media: ApprovedMediaView) => {
    const ok = await confirm({
      title: `Delete this ${media.type === "VIDEO" ? "video" : "photo"}?`,
      description: "This can't be undone.",
    });
    if (!ok) return;
    await run(media.id, "delete", () => onDeleteApproved(media));
  };
  return (
    <div>
      <div className="mb-10 flex items-center justify-between gap-4 bg-white p-4 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
        <div>
          <h2 className="font-(family-name:--serif) text-xl text-foreground">Gallery Wall</h2>
          <p className="mt-1 text-xs text-foreground/60">
            {galleryEnabled
              ? "Live — guests can view and upload photos."
              : "Hidden from guests. Turn this on when it's time (e.g. the wedding day)."}
          </p>
        </div>
        <button
          type="button"
          disabled={isPending("gallery")}
          onClick={() => run("gallery", "toggle", onToggleGallery)}
          className={`shrink-0 px-4 py-2 text-xs font-medium transition-colors disabled:opacity-60 ${
            galleryEnabled
              ? "border border-olive/30 text-foreground hover:border-burnt-orange hover:text-burnt-orange"
              : "bg-burnt-orange text-ivory hover:bg-burnt-orange-dark"
          }`}
        >
          {isPending("gallery", "toggle")
            ? "Saving…"
            : galleryEnabled
              ? "Disable Gallery Wall"
              : "Enable Gallery Wall"}
        </button>
      </div>

      <h2 className="mb-5 font-(family-name:--serif) text-2xl text-foreground">Pending Uploads</h2>

      {pending.length === 0 ? (
        <p className="text-sm text-foreground/60">No pending uploads right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {pending.map((media) => (
            <div key={media.id} className="bg-white shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
              <div className="relative aspect-square w-full overflow-hidden bg-olive/10">
                {media.type === "VIDEO" ? (
                  <video src={media.url} muted playsInline controls className="h-full w-full object-cover" />
                ) : (
                  <Image src={media.url} alt={`Upload from ${media.guestName}`} fill sizes="25vw" className="object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-foreground/70">
                  {media.guestName} &middot; {media.dateUploaded}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={isPending(media.id)}
                    onClick={() => run(media.id, "approve", () => onApprove(media))}
                    className="flex-1 bg-burnt-orange px-3 py-1.5 text-xs font-medium text-ivory hover:bg-burnt-orange-dark disabled:opacity-60"
                  >
                    {isPending(media.id, "approve") ? "Approving…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending(media.id)}
                    onClick={() => run(media.id, "hide", () => onHide(media))}
                    className="flex-1 border border-olive/30 px-3 py-1.5 text-xs font-medium text-foreground hover:border-burnt-orange hover:text-burnt-orange disabled:opacity-60"
                  >
                    {isPending(media.id, "hide") ? "Hiding…" : "Hide"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 mb-5 font-(family-name:--serif) text-2xl text-foreground">Approved Media</h2>

      {approved.length === 0 ? (
        <p className="text-sm text-foreground/60">Nothing approved yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {approved.map((media) => (
            <div key={media.id} className="bg-white shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
              <div className="relative aspect-square w-full overflow-hidden bg-olive/10">
                {media.type === "VIDEO" ? (
                  <video src={media.url} muted playsInline controls className="h-full w-full object-cover" />
                ) : (
                  <Image src={media.url} alt={`Photo from ${media.guestName}`} fill sizes="25vw" className="object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-foreground/70">
                  {media.guestName} &middot; {media.dateUploaded}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={isPending(media.id)}
                    onClick={() => run(media.id, "hide", () => onHideApproved(media))}
                    className="flex-1 border border-olive/30 px-3 py-1.5 text-xs font-medium text-foreground hover:border-burnt-orange hover:text-burnt-orange disabled:opacity-60"
                  >
                    {isPending(media.id, "hide") ? "Hiding…" : "Hide"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending(media.id)}
                    onClick={() => handleDeleteApproved(media)}
                    className="flex-1 border border-olive/30 px-3 py-1.5 text-xs font-medium text-foreground hover:border-burnt-orange hover:text-burnt-orange disabled:opacity-60"
                  >
                    {isPending(media.id, "delete") ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 mb-5 font-(family-name:--serif) text-2xl text-foreground">Hidden Media</h2>
      <p className="mb-5 max-w-2xl text-sm text-foreground/60">
        Hidden uploads aren&apos;t deleted — they&apos;re kept here so you can
        bring any of them back if you change your mind.
      </p>

      {hidden.length === 0 ? (
        <p className="text-sm text-foreground/60">Nothing hidden right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {hidden.map((media) => (
            <div key={media.id} className="bg-white opacity-70 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
              <div className="relative aspect-square w-full overflow-hidden bg-olive/10">
                {media.type === "VIDEO" ? (
                  <video src={media.url} muted playsInline controls className="h-full w-full object-cover" />
                ) : (
                  <Image src={media.url} alt={`Upload from ${media.guestName}`} fill sizes="25vw" className="object-cover" />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-foreground/70">
                  {media.guestName} &middot; {media.dateUploaded}
                </p>
                <button
                  type="button"
                  disabled={isPending(media.id)}
                  onClick={() => run(media.id, "restore", () => onRestore(media))}
                  className="mt-2 w-full border border-olive/30 px-3 py-1.5 text-xs font-medium text-foreground hover:border-burnt-orange hover:text-burnt-orange disabled:opacity-60"
                >
                  {isPending(media.id, "restore") ? "Restoring…" : "Restore"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
