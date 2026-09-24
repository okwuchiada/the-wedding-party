import Link from "next/link";
import { date, Table } from "@/components/super/table";
import { requireSuperAdmin } from "@/lib/dal";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

const NAIRA = { currency: "NGN", locale: "en-NG" };
const DAY = 24 * 60 * 60 * 1000;

async function loadOverview() {
  const since = new Date(Date.now() - 30 * DAY);
  return Promise.all([
    prisma.wedding.groupBy({ by: ["status"], _count: true }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amountKobo: true }, _count: true }),
    prisma.payment.aggregate({ where: { status: "SUCCESS", paidAt: { gte: since } }, _sum: { amountKobo: true } }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.wedding.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { story: { select: { brideName: true, groomName: true } }, plan: { select: { name: true } } },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { actor: { select: { email: true } }, wedding: { select: { slug: true } } },
    }),
  ]);
}

export default async function SuperOverviewPage() {
  await requireSuperAdmin();
  const [byStatus, revenue, revenue30, signups30, recentWeddings, recentAudit] = await loadOverview();
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
          <div key={s.label} className="rounded-[6px] bg-white p-4">
            <p className="text-xs text-foreground/55">{s.label}</p>
            <p className="mt-2 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 font-(family-name:--m-display) font-bold tracking-tight text-2xl">Newest weddings</h2>
        <Table head={["Couple", "Address", "Status", "Plan", "Created"]}>
          {recentWeddings.map((w) => (
            <tr key={w.id}>
              <td className="px-3 py-2.5">
                <Link href={`/super/weddings?q=${w.slug}`} className="hover:text-burnt-orange">
                  {w.story ? `${w.story.brideName} & ${w.story.groomName}` : "—"}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-foreground/70">/w/{w.slug}</td>
              <td className="px-3 py-2.5 text-foreground/70">{w.status.toLowerCase()}</td>
              <td className="px-3 py-2.5 text-foreground/70">{w.plan?.name ?? "—"}</td>
              <td className="px-3 py-2.5 text-foreground/70">{date(w.createdAt)}</td>
            </tr>
          ))}
        </Table>
      </section>

      <section>
        <h2 className="mb-3 font-(family-name:--m-display) font-bold tracking-tight text-2xl">Recent activity</h2>
        <Table head={["When", "Who", "Action", "Wedding"]}>
          {recentAudit.map((a) => (
            <tr key={a.id}>
              <td className="px-3 py-2.5 whitespace-nowrap text-foreground/70">{a.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
              <td className="px-3 py-2.5 text-foreground/70">{a.actor?.email ?? "system"}</td>
              <td className="px-3 py-2.5">{a.action}</td>
              <td className="px-3 py-2.5 text-foreground/70">{a.wedding ? `/w/${a.wedding.slug}` : "—"}</td>
            </tr>
          ))}
        </Table>
      </section>
    </div>
  );
}
