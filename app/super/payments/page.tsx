import ActionButton from "@/components/super/action-button";
import MarkPaidButton from "@/components/super/mark-paid-button";
import { Pagination } from "@/components/super/pagination";
import { FilterSelect, SearchForm } from "@/components/super/search-form";
import { StatusBadge } from "@/components/super/status-badge";
import { date, Table } from "@/components/super/table";
import { TableCell, TableRow } from "@/components/ui/table";
import { reverifyPayment } from "@/lib/actions/super";
import { requirePermission } from "@/lib/dal";
import type { PaymentStatus, Prisma } from "@/lib/generated/prisma/client";
import { formatMoney } from "@/lib/money";
import { readPagination } from "@/lib/pagination";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const STATUSES: PaymentStatus[] = ["PENDING", "SUCCESS", "FAILED"];
const NAIRA = { currency: "NGN", locale: "en-NG" };

const SORTS = {
  newest: { label: "Newest first", orderBy: { createdAt: "desc" } },
  oldest: { label: "Oldest first", orderBy: { createdAt: "asc" } },
  amountDesc: { label: "Amount (high–low)", orderBy: { amountKobo: "desc" } },
  amountAsc: { label: "Amount (low–high)", orderBy: { amountKobo: "asc" } },
} satisfies Record<string, { label: string; orderBy: Prisma.PaymentOrderByWithRelationInput }>;
type SortKey = keyof typeof SORTS;

export default async function SuperPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; plan?: string; sort?: string; page?: string; pageSize?: string }>;
}) {
  const staff = await requirePermission("console.view");
  const canReverify = can(staff.role, "payment.reverify");
  const canResolve = can(staff.role, "payment.resolve");
  const sp = await searchParams;
  const { q = "", status, plan, sort } = sp;
  const term = q.trim();
  const sortKey: SortKey = sort && sort in SORTS ? (sort as SortKey) : "newest";
  const { page, pageSize, skip, take } = readPagination(sp);

  const where: Prisma.PaymentWhereInput = {
    ...(STATUSES.includes(status as PaymentStatus) ? { status: status as PaymentStatus } : {}),
    ...(plan ? { plan: { key: plan } } : {}),
    ...(term
      ? { OR: [{ reference: { contains: term } }, { wedding: { slug: { contains: term, mode: "insensitive" } } }] }
      : {}),
  };
  const [total, payments, plans] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: [SORTS[sortKey].orderBy, { id: "asc" }],
      skip,
      take,
      include: { plan: { select: { name: true } }, wedding: { select: { slug: true } } },
    }),
    prisma.plan.findMany({ orderBy: [{ sortOrder: "asc" }, { priceKobo: "asc" }], select: { key: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <SearchForm q={term} placeholder="Reference or wedding slug">
        <FilterSelect
          name="status"
          defaultValue={status ?? ""}
          allLabel="All statuses"
          label="Status"
          options={STATUSES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))}
        />
        <FilterSelect name="plan" defaultValue={plan ?? ""} allLabel="All plans" label="Plan" options={plans.map((p) => ({ value: p.key, label: p.name }))} />
        <FilterSelect name="sort" defaultValue={sortKey} label="Sort" options={Object.entries(SORTS).map(([key, { label }]) => ({ value: key, label }))} />
      </SearchForm>
      <Table head={["Created", "Wedding", "Plan", "Amount", "Status", "Reference", ""]}>
        {payments.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="text-muted-foreground">{date(p.createdAt)}</TableCell>
            <TableCell>/w/{p.wedding.slug}</TableCell>
            <TableCell className="text-muted-foreground">{p.plan.name}</TableCell>
            <TableCell className="tabular-nums">{formatMoney(p.amountKobo, NAIRA)}</TableCell>
            <TableCell className="text-muted-foreground">
              <StatusBadge status={p.status} />
              {p.paidAt && <span className="mt-1 block text-xs text-muted-foreground">paid {date(p.paidAt)}</span>}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{p.reference}</TableCell>
            <TableCell>
              {p.status !== "SUCCESS" && (
                <div className="flex flex-col items-start gap-1.5">
                  {canReverify && <ActionButton action={reverifyPayment.bind(null, p.reference)} label="Check with Paystack" />}
                  {canResolve && <MarkPaidButton reference={p.reference} amountLabel={formatMoney(p.amountKobo, NAIRA)} />}
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </Table>
      <Pagination page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
