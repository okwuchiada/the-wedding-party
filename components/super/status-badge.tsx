import type { PaymentStatus, WeddingStatus } from "@/lib/generated/prisma/client";

const STATUS_STYLES: Record<WeddingStatus | PaymentStatus, string> = {
  DRAFT: "bg-(--m-mist)/60 text-(--m-ink)/75",
  ACTIVE: "bg-(--m-emerald)/15 text-(--m-emerald)",
  SUSPENDED: "bg-(--m-coral)/15 text-(--m-coral-deep)",
  ARCHIVED: "bg-(--m-ink)/10 text-(--m-ink)/75",
  PENDING: "bg-(--m-gold)/30 text-(--m-ink)",
  SUCCESS: "bg-(--m-emerald)/15 text-(--m-emerald)",
  FAILED: "bg-(--m-coral)/15 text-(--m-coral-deep)",
};

/** A colour-coded pill for a wedding or payment status. */
export function StatusBadge({ status }: { status: WeddingStatus | PaymentStatus }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
