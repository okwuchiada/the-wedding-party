import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardBar from "@/components/admin/dashboard-bar";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { dashboardPath, guestPath, weddingTheme } from "@/lib/tenant";

const STATUS = {
  DRAFT: { label: "Draft", className: "bg-(--m-mist) text-(--m-ink)" },
  ACTIVE: { label: "Live", className: "bg-(--m-emerald)/12 text-(--m-emerald)" },
  SUSPENDED: { label: "Suspended", className: "bg-(--m-coral)/12 text-(--m-coral-deep)" },
  ARCHIVED: { label: "Archived", className: "bg-(--m-mist) text-(--m-ink)/70" },
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
  if (weddings.length === 0) redirect("/dashboard/new");

  return (
    <>
      <DashboardBar isSuperAdmin={user.role === "SUPER_ADMIN" && !user.impersonatorId} />
      <div className="mx-auto max-w-6xl px-5 pt-4 pb-20 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-(family-name:--m-display) text-4xl leading-none font-extrabold tracking-[-0.03em] sm:text-5xl">
              Your weddings
            </h1>
            <p className="mt-3 text-(--m-ink)/65">Signed in as {user.email}</p>
          </div>
          <Link
            href="/dashboard/new"
            className="rounded-full bg-(--m-gold) px-5 py-3 text-sm font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper)"
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
                  className="group flex h-full flex-col overflow-hidden rounded-[6px] border border-(--m-mist) bg-white transition-shadow hover:shadow-[0_24px_48px_-32px_rgb(22_32_74/0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--m-ink)"
                >
                  <span aria-hidden className="flex h-2">
                    {(["primary", "cream", "accent", "background", "primaryDark"] as const).map((k, i) => (
                      <span key={k} style={{ background: colors[k], flexGrow: i % 2 ? 1 : 2 }} />
                    ))}
                  </span>
                  <span className="flex flex-1 flex-col gap-3 p-5">
                    <span className="font-(family-name:--m-display) text-2xl font-bold tracking-tight group-hover:underline">
                      {wedding.story ? `${wedding.story.brideName} & ${wedding.story.groomName}` : wedding.slug}
                    </span>
                    <span className="text-sm text-(--m-ink)/65">{guestPath(wedding.slug)}</span>
                    <span className="mt-auto flex items-center gap-2 text-xs font-medium">
                      <span className={`rounded-full px-2.5 py-1 ${status.className}`}>{status.label}</span>
                      {wedding.plan && <span className="text-(--m-ink)/60">{wedding.plan.name}</span>}
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
