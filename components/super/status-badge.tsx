import type { PaymentStatus, WeddingStatus } from "@/lib/generated/prisma/client";

const STATUS_STYLES: Record<WeddingStatus | PaymentStatus, string> = {
  DRAFT: "bg-line/60 text-ink/75",
  ACTIVE: "bg-success/15 text-success",
  SUSPENDED: "bg-danger/15 text-danger",
  ARCHIVED: "bg-ink/10 text-ink/75",
  PENDING: "bg-action/30 text-ink",
  SUCCESS: "bg-success/15 text-success",
  FAILED: "bg-danger/15 text-danger",
};

/** A colour-coded pill for a wedding or payment status. */
export function StatusBadge({ status }: { status: WeddingStatus | PaymentStatus }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
