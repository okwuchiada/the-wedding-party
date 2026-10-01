"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";
import type { MediaView } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { Segmented } from "@/components/ui/segmented";
import { Pagination, usePagination } from "./pagination";
import type { ReviewStatus } from "./review";
import { useConfirm } from "./use-confirm";
import { useActionPending } from "./use-action-pending";
import { canOptimizeImage } from "@/lib/image-src";

const EMPTY: Record<ReviewStatus, { title: string; body: string }> = {
  PENDING: { title: "Nothing waiting for you", body: "Photos and videos guests upload appear here for you to approve." },
  APPROVED: { title: "No approved photos yet", body: "Photos you approve show on your photo wall." },
  HIDDEN: { title: "Nothing hidden", body: "Hidden uploads stay here, so you can bring any back." },
};

/** A square preview; videos show a play badge and open in a new tab instead of playing in the grid. */
function Thumb({ media }: { media: MediaView }) {
  const label = `${media.type === "VIDEO" ? "Video" : "Photo"} from ${media.guestName}`;
  return (
    <a href={media.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-square w-full overflow-hidden rounded-t-[8px] bg-accent" aria-label={`Open ${label.toLowerCase()} in a new tab`}>
      {media.type === "VIDEO" ? (
        <>
          <video src={media.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-10 place-items-center rounded-full bg-ink/70 text-paper">
              <Play aria-hidden size={18} />
            </span>
          </span>
        </>
      ) : (
        <Image src={media.url} unoptimized={!canOptimizeImage(media.url)} alt={label} fill sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw" className="object-cover" />
      )}
    </a>
  );
}

export default function MediaTab({
  pending,
  approved,
  hidden,
  galleryEnabled,
  onChange,
  onDeleteApproved,
  onToggleGallery,
}: {
  pending: MediaView[];
  approved: MediaView[];
  hidden: MediaView[];
  galleryEnabled: boolean;
  onChange: (items: MediaView[], from: ReviewStatus, to: ReviewStatus) => Promise<void>;
  onDeleteApproved: (media: MediaView) => Promise<void>;
  onToggleGallery: () => Promise<void>;
}) {
  const [view, setView] = useState<ReviewStatus>("PENDING");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { confirm, confirmDialog } = useConfirm();
  const { run, isPending } = useActionPending();
  const lists = { PENDING: pending, APPROVED: approved, HIDDEN: hidden };
  const paged = usePagination(lists[view], 25);
  const selectedItems = pending.filter((m) => selected.has(m.id));

  const changeView = (next: ReviewStatus) => {
    setView(next);
    setSelected(new Set());
  };

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulk = (to: ReviewStatus) =>
    run("bulk", to, async () => {
      await onChange(selectedItems, "PENDING", to);
      setSelected(new Set());
    });

  const handleDelete = async (media: MediaView) => {
    const ok = await confirm({
      title: `Delete this ${media.type === "VIDEO" ? "video" : "photo"}?`,
      description: "This can't be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    await run(media.id, "delete", () => onDeleteApproved(media));
  };

  const move = (media: MediaView, to: ReviewStatus, label: string, pendingLabel: string, variant: "default" | "outline") => (
    <Button
      size="sm"
      variant={variant}
      className="flex-1"
      disabled={isPending(media.id)}
      onClick={() => run(media.id, to, () => onChange([media], view, to))}
    >
      {isPending(media.id, to) ? pendingLabel : label}
    </Button>
  );

  return (
    <div className="flex flex-col gap-10">
      <Card className="flex-row flex-wrap items-center justify-between gap-4 rounded-md p-5 shadow-none">
        <div>
          <h2 className="font-(family-name:--m-display) text-xl font-bold tracking-tight text-ink">Photo wall</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {galleryEnabled
              ? "On: guests can see the wall and upload photos."
              : "Off: guests can't see it yet. Turn it on when it's time, such as on the wedding day."}
          </p>
        </div>
        <Button
          variant={galleryEnabled ? "outline" : "default"}
          size="sm"
          disabled={isPending("gallery")}
          onClick={() => run("gallery", "toggle", onToggleGallery)}
        >
          {isPending("gallery", "toggle") ? "Saving…" : galleryEnabled ? "Turn off photo wall" : "Turn on photo wall"}
        </Button>
      </Card>

      <section>
        <SectionHeading
          title="Guest photos"
          action={
            <Segmented
              label="Show"
              value={view}
              onChange={changeView}
              options={[
                { value: "PENDING", label: "Pending", count: pending.length },
                { value: "APPROVED", label: "Approved", count: approved.length },
                { value: "HIDDEN", label: "Hidden", count: hidden.length },
              ]}
            />
          }
        />

        {view === "PENDING" && selected.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-gold/20 px-4 py-3 text-sm font-semibold text-ink" role="status">
            <span>{selected.size} selected</span>
            <span className="flex gap-2">
              <Button size="sm" disabled={isPending("bulk")} onClick={() => bulk("APPROVED")}>
                {isPending("bulk", "APPROVED") ? "Approving…" : "Approve"}
              </Button>
              <Button size="sm" variant="outline" disabled={isPending("bulk")} onClick={() => bulk("HIDDEN")}>
                {isPending("bulk", "HIDDEN") ? "Hiding…" : "Hide"}
              </Button>
            </span>
          </div>
        )}

        {paged.total === 0 ? (
          <EmptyState title={EMPTY[view].title} body={EMPTY[view].body} />
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {paged.pageItems.map((media) => (
                <li key={media.id} className={`relative rounded-[8px] border border-border bg-card ${view === "HIDDEN" ? "opacity-75" : ""}`}>
                  <Thumb media={media} />
                  {view === "PENDING" && (
                    <span className="absolute top-2 left-2 grid size-8 place-items-center rounded-full bg-card/90">
                      <Checkbox
                        checked={selected.has(media.id)}
                        onCheckedChange={() => toggleSelected(media.id)}
                        aria-label={`Select ${media.type === "VIDEO" ? "video" : "photo"} from ${media.guestName}`}
                      />
                    </span>
                  )}
                  <div className="p-3">
                    <p className="truncate text-[13px] text-muted-foreground">
                      {media.guestName} &middot; {media.dateUploaded}
                    </p>
                    <div className="mt-2 flex gap-2">
                      {view === "PENDING" && (
                        <>
                          {move(media, "APPROVED", "Approve", "Approving…", "default")}
                          {move(media, "HIDDEN", "Hide", "Hiding…", "outline")}
                        </>
                      )}
                      {view === "APPROVED" && (
                        <>
                          {move(media, "HIDDEN", "Hide", "Hiding…", "outline")}
                          <Button size="sm" variant="outline" className="flex-1" disabled={isPending(media.id)} onClick={() => handleDelete(media)}>
                            {isPending(media.id, "delete") ? "Deleting…" : "Delete"}
                          </Button>
                        </>
                      )}
                      {view === "HIDDEN" && move(media, "APPROVED", "Restore", "Restoring…", "outline")}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onPageChange={paged.setPage} onPageSizeChange={paged.setPageSize} />
          </>
        )}
      </section>

      {confirmDialog}
    </div>
  );
}
