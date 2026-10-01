import type { PaymentStatus, WeddingStatus } from "@/lib/generated/prisma/client";

const STATUS_STYLES: Record<WeddingStatus | PaymentStatus, string> = {
  DRAFT: "bg-border/60 text-ink/75",
  ACTIVE: "bg-emerald/15 text-emerald",
  SUSPENDED: "bg-destructive/15 text-destructive",
  ARCHIVED: "bg-ink/10 text-ink/75",
  PENDING: "bg-gold/30 text-ink",
  SUCCESS: "bg-emerald/15 text-emerald",
  FAILED: "bg-destructive/15 text-destructive",
};

/** A colour-coded pill for a wedding or payment status. */
export function StatusBadge({ status }: { status: WeddingStatus | PaymentStatus }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
