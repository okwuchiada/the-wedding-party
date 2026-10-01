import Link from "next/link";
import { Pagination } from "@/components/super/pagination";
import { StatusBadge } from "@/components/super/status-badge";
import { date, Table } from "@/components/super/table";
import { TableCell, TableRow } from "@/components/ui/table";
import { requirePermission } from "@/lib/dal";
import { coupleTitle, resolveLayout } from "@/lib/layouts";
import { formatMoney } from "@/lib/money";
import { readPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

const NAIRA = { currency: "NGN", locale: "en-NG" };
const DAY = 24 * 60 * 60 * 1000;

async function loadOverview(weddings: ReturnType<typeof readPagination>, activity: ReturnType<typeof readPagination>) {
  const since = new Date(Date.now() - 30 * DAY);
  return Promise.all([
    prisma.wedding.groupBy({ by: ["status"], _count: true }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amountKobo: true }, _count: true }),
    prisma.payment.aggregate({ where: { status: "SUCCESS", paidAt: { gte: since } }, _sum: { amountKobo: true } }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.wedding.count(),
    prisma.wedding.findMany({
      orderBy: { createdAt: "desc" },
      skip: weddings.skip,
      take: weddings.take,
      include: {
        story: { select: { brideName: true, groomName: true } },
        theme: { select: { heroNames: true } },
        plan: { select: { name: true } },
      },
    }),
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: activity.skip,
      take: activity.take,
      include: { actor: { select: { email: true } }, wedding: { select: { slug: true } } },
    }),
  ]);
}

export default async function SuperOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ weddingsPage?: string; weddingsPageSize?: string; activityPage?: string; activityPageSize?: string }>;
}) {
  await requirePermission("console.view");
  const sp = await searchParams;
  const weddings = readPagination(sp, { prefix: "weddings", defaultPageSize: 10 });
  const activity = readPagination(sp, { prefix: "activity", defaultPageSize: 10 });

  const [byStatus, revenue, revenue30, signups30, weddingsTotal, recentWeddings, activityTotal, recentAudit] = await loadOverview(
    weddings,
    activity
  );
  const count = (status: string) => byStatus.find((s) => s.status === status)?._count ?? 0;

  const stats = [
    { label: "Live weddings", value: count("ACTIVE") },
    { label: "Drafts", value: count("DRAFT") },
    { label: "Suspended", value: count("SUSPENDED") + count("ARCHIVED") },
    { label: "Revenue (all time)", value: formatMoney(revenue._sum.amountKobo ?? 0, NAIRA) },
    { label: "Revenue (30 days)", value: formatMoney(revenue30._sum.amountKobo ?? 0, NAIRA) },
    { label: "Sign-ups (30 days)", value: signups30 },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 font-(family-name:--m-display) font-bold tracking-tight text-2xl">Newest weddings</h2>
        <Table head={["Couple", "Address", "Status", "Plan", "Created"]}>
          {recentWeddings.map((w) => (
            <TableRow key={w.id}>
              <TableCell className="py-2.5">
                <Link href={`/super/weddings?q=${w.slug}`} className="hover:text-ink hover:underline">
                  {coupleTitle(w.story, resolveLayout(w.theme).heroNames) ?? "—"}
                </Link>
              </TableCell>
              <TableCell className="py-2.5 text-muted-foreground">/w/{w.slug}</TableCell>
              <TableCell className="py-2.5">
                <StatusBadge status={w.status} />
              </TableCell>
              <TableCell className="py-2.5 text-muted-foreground">{w.plan?.name ?? "—"}</TableCell>
              <TableCell className="py-2.5 text-muted-foreground">{date(w.createdAt)}</TableCell>
            </TableRow>
          ))}
        </Table>
        <Pagination prefix="weddings" page={weddings.page} pageSize={weddings.pageSize} total={weddingsTotal} />
      </section>

      <section>
        <h2 className="mb-3 font-(family-name:--m-display) font-bold tracking-tight text-2xl">Recent activity</h2>
        <Table head={["When", "Who", "Action", "Wedding"]}>
          {recentAudit.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="py-2.5 whitespace-nowrap text-muted-foreground">{a.createdAt.toISOString().slice(0, 16).replace("T", " ")}</TableCell>
              <TableCell className="py-2.5 text-muted-foreground">{a.actor?.email ?? "system"}</TableCell>
              <TableCell className="py-2.5">{a.action}</TableCell>
              <TableCell className="py-2.5 text-muted-foreground">{a.wedding ? `/w/${a.wedding.slug}` : "—"}</TableCell>
            </TableRow>
          ))}
        </Table>
        <Pagination prefix="activity" page={activity.page} pageSize={activity.pageSize} total={activityTotal} />
      </section>
    </div>
  );
}
