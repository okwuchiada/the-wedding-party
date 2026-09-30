"use client";

import { useState } from "react";
import { setPublished } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAdminWeddingId } from "./wedding-context";

type Status = "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";

const CHIP: Record<Status, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-action/25 text-ink" },
  ACTIVE: { label: "Live", className: "bg-success/12 text-success" },
  SUSPENDED: { label: "Suspended", className: "bg-danger/12 text-danger" },
  ARCHIVED: { label: "Archived", className: "bg-line text-muted" },
};

/** The site's status and the one button that changes it. Server refuses non-owners too. */
export default function PublishControl({
  status,
  canPublish,
  compact = false,
  readOnly = false,
}: {
  status: Status;
  canPublish: boolean;
  compact?: boolean;
  /** Show the status only (editors and view-only staff can't publish). */
  readOnly?: boolean;
}) {
  const weddingId = useAdminWeddingId();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const live = status === "ACTIVE";
  const locked = status === "SUSPENDED" || status === "ARCHIVED";

  const toggle = async () => {
    setPending(true);
    const result = await setPublished(weddingId, !live);
    setPending(false);
    if (result.error) toast({ message: result.error, tone: "error" });
    else toast({ message: live ? "Site unpublished" : "Site published" });
  };

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className={`rounded-full px-2.5 py-1 text-[13px] font-semibold ${CHIP[status].className}`}>{CHIP[status].label}</span>
      {!locked && !readOnly && (
        <Button
          variant={live ? "secondary" : "primary"}
          size={compact ? "sm" : "md"}
          onClick={toggle}
          disabled={pending || (!live && !canPublish)}
          title={!live && !canPublish ? "Choose a plan in Billing to publish" : undefined}
        >
          {pending ? "Saving…" : live ? "Unpublish" : "Publish site"}
        </Button>
      )}
    </span>
  );
}
