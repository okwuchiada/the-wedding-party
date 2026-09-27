import ActionButton from "@/components/super/action-button";
import { Pagination } from "@/components/super/pagination";
import { FilterSelect, SearchForm } from "@/components/super/search-form";
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

export default async function SuperPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; pageSize?: string }>;
}) {
  const staff = await requirePermission("console.view");
  const canReverify = can(staff.role, "payment.reverify");
  const sp = await searchParams;
  const { q = "", status } = sp;
  const term = q.trim();
  const { page, pageSize, skip, take } = readPagination(sp);

  const where: Prisma.PaymentWhereInput = {
    ...(STATUSES.includes(status as PaymentStatus) ? { status: status as PaymentStatus } : {}),
    ...(term
      ? { OR: [{ reference: { contains: term } }, { wedding: { slug: { contains: term, mode: "insensitive" } } }] }
      : {}),
  };
  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { plan: { select: { name: true } }, wedding: { select: { slug: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <SearchForm q={term} placeholder="Reference or wedding slug">
        <FilterSelect
          name="status"
          defaultValue={status ?? ""}
          allLabel="All statuses"
          options={STATUSES.map((s) => ({ value: s, label: s.toLowerCase() }))}
        />
      </SearchForm>
      <Table head={["Created", "Wedding", "Plan", "Amount", "Status", "Reference", ""]}>
        {payments.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="text-foreground/70">{date(p.createdAt)}</TableCell>
            <TableCell>/w/{p.wedding.slug}</TableCell>
            <TableCell className="text-foreground/80">{p.plan.name}</TableCell>
            <TableCell>{formatMoney(p.amountKobo, NAIRA)}</TableCell>
            <TableCell className="text-foreground/80">
              {p.status.toLowerCase()}
              {p.paidAt && <span className="block text-xs text-foreground/55">paid {date(p.paidAt)}</span>}
            </TableCell>
            <TableCell className="font-mono text-xs text-foreground/70">{p.reference}</TableCell>
            <TableCell>
              {canReverify && p.status !== "SUCCESS" && <ActionButton action={reverifyPayment.bind(null, p.reference)} label="Check with Paystack" />}
            </TableCell>
          </TableRow>
        ))}
      </Table>
      <Pagination page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
