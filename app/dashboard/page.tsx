import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardBar from "@/components/admin/dashboard-bar";
import { can } from "@/lib/permissions";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { coupleTitle, resolveLayout } from "@/lib/layouts";
import { dashboardPath, guestPath, weddingTheme } from "@/lib/tenant";
import { countdownLabel } from "@/lib/countdown-label";
import { buttonClass } from "@/components/ui/button";

const STATUS = {
  DRAFT: { label: "Draft", className: "bg-line text-ink" },
  ACTIVE: { label: "Live", className: "bg-success/12 text-success" },
  SUSPENDED: { label: "Suspended", className: "bg-danger/12 text-danger" },
  ARCHIVED: { label: "Archived", className: "bg-line text-ink/70" },
} as const;

export default async function DashboardIndexPage() {
  const user = await verifySession();

  const weddings = await prisma.wedding.findMany({
    where: { members: { some: { userId: user.id } } },
    include: {
      story: { select: { brideName: true, groomName: true, weddingDate: true } },
      plan: true,
      theme: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (weddings.length === 1) redirect(dashboardPath(weddings[0].id));
  if (weddings.length === 0) {
    // Staff usually have no weddings of their own; their home is the console.
    redirect(can(user.role, "console.view") && !user.impersonatorId ? "/super" : "/dashboard/new");
  }

  // Attending RSVPs and everything waiting for review, per wedding, in one query.
  const counts = new Map(
    (
      await prisma.wedding.findMany({
        where: { id: { in: weddings.map((w) => w.id) } },
        select: {
          id: true,
          _count: {
            select: {
              rsvps: { where: { attending: true } },
              contributions: { where: { status: "AWAITING_CONFIRMATION" } },
              wishes: { where: { status: "PENDING" } },
              media: { where: { status: "PENDING" } },
            },
          },
        },
      })
    ).map((w) => [w.id, { rsvps: w._count.rsvps, toReview: w._count.contributions + w._count.wishes + w._count.media }])
  );

  return (
    <>
      <DashboardBar showConsole={can(user.role, "console.view") && !user.impersonatorId} />
      <div className="mx-auto max-w-6xl px-5 pt-4 pb-20 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-(family-name:--m-display) text-4xl leading-none font-extrabold tracking-[-0.03em] sm:text-5xl">
              Your weddings
            </h1>
            <p className="mt-3 text-muted">Signed in as {user.email}</p>
          </div>
          <Link
            href="/dashboard/new"
            className={buttonClass("primary", "md")}
          >
            Create another wedding
          </Link>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weddings.map((wedding) => {
            const { colors } = weddingTheme(wedding);
            const status = STATUS[wedding.status];
            return (
              <li key={wedding.id}>
                <Link
                  href={dashboardPath(wedding.id)}
                  className="group flex h-full flex-col overflow-hidden rounded-[6px] border border-line bg-surface transition-shadow hover:shadow-[0_24px_48px_-32px_rgb(22_32_74/0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <span aria-hidden className="flex h-2">
                    {(["primary", "cream", "accent", "background", "primaryDark"] as const).map((k, i) => (
                      <span key={k} style={{ background: colors[k], flexGrow: i % 2 ? 1 : 2 }} />
                    ))}
                  </span>
                  <span className="flex flex-1 flex-col gap-3 p-5">
                    <span className="font-(family-name:--m-display) text-2xl font-bold tracking-tight group-hover:underline">
                      {coupleTitle(wedding.story, resolveLayout(wedding.theme).heroNames) ?? wedding.slug}
                    </span>
                    <span className="text-sm text-muted">
                      {wedding.story?.weddingDate
                        ? `${wedding.story.weddingDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} · ${countdownLabel(wedding.story.weddingDate)}`
                        : guestPath(wedding.slug)}
                    </span>
                    <span className="mt-auto flex flex-wrap items-center gap-2 text-[13px] font-medium">
                      <span className={`rounded-full px-2.5 py-1 ${status.className}`}>{status.label}</span>
                      <span className="rounded-full bg-surface-muted px-2.5 py-1">{counts.get(wedding.id)?.rsvps ?? 0} said yes</span>
                      {(counts.get(wedding.id)?.toReview ?? 0) > 0 && (
                        <span className="rounded-full bg-danger/12 px-2.5 py-1 text-danger">{counts.get(wedding.id)?.toReview} to review</span>
                      )}
                      {wedding.plan && <span className="text-muted">{wedding.plan.name}</span>}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
