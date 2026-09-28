import ActionButton from "@/components/super/action-button";
import MarkPaidButton from "@/components/super/mark-paid-button";
import { Pagination } from "@/components/super/pagination";
import { SearchForm } from "@/components/super/search-form";
import { date, Table } from "@/components/super/table";
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
  const canResolve = can(staff.role, "payment.resolve");
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
        <select name="status" defaultValue={status ?? ""} className="border border-(--m-mist) bg-white px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.toLowerCase()}
            </option>
          ))}
        </select>
      </SearchForm>
      <Table head={["Created", "Wedding", "Plan", "Amount", "Status", "Reference", ""]}>
        {payments.map((p) => (
          <tr key={p.id}>
            <td className="px-3 py-3 text-foreground/70">{date(p.createdAt)}</td>
            <td className="px-3 py-3">/w/{p.wedding.slug}</td>
            <td className="px-3 py-3 text-foreground/80">{p.plan.name}</td>
            <td className="px-3 py-3">{formatMoney(p.amountKobo, NAIRA)}</td>
            <td className="px-3 py-3 text-foreground/80">
              {p.status.toLowerCase()}
              {p.paidAt && <span className="block text-xs text-foreground/55">paid {date(p.paidAt)}</span>}
            </td>
            <td className="px-3 py-3 font-mono text-xs text-foreground/70">{p.reference}</td>
            <td className="px-3 py-3">
              {p.status !== "SUCCESS" && (
                <div className="flex flex-col items-start gap-1.5">
                  {canReverify && <ActionButton action={reverifyPayment.bind(null, p.reference)} label="Check with Paystack" />}
                  {canResolve && <MarkPaidButton reference={p.reference} amountLabel={formatMoney(p.amountKobo, NAIRA)} />}
                </div>
              )}
            </td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
