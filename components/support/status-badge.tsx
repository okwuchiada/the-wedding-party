import type { SupportRequestStatus } from "@/lib/generated/prisma/client";
import { SUPPORT_STATUS_LABELS } from "@/lib/support";

const STYLES: Record<SupportRequestStatus, string> = {
  OPEN: "bg-gold/30 text-ink",
  IN_PROGRESS: "bg-ink/10 text-ink",
  RESOLVED: "bg-emerald/15 text-emerald",
};

/** A colour-coded pill for a support request, shown to couples and staff alike. */
export function SupportStatusBadge({ status }: { status: SupportRequestStatus }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${STYLES[status]}`}>
      {SUPPORT_STATUS_LABELS[status]}
    </span>
  );
}
