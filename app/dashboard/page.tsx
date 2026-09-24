import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/admin/sign-out-button";
import { logout } from "@/lib/actions/auth";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { dashboardPath, guestPath } from "@/lib/tenant";

const STATUS_LABELS = {
  DRAFT: "Draft",
  ACTIVE: "Live",
  SUSPENDED: "Suspended",
  ARCHIVED: "Archived",
} as const;

export default async function DashboardIndexPage() {
  const user = await verifySession();

  const weddings = await prisma.wedding.findMany({
    where: { members: { some: { userId: user.id } } },
    include: { story: { select: { brideName: true, groomName: true, weddingDate: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (weddings.length === 1) redirect(dashboardPath(weddings[0].id));

  return (
    <div className="min-h-screen bg-ivory px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-olive">Dashboard</p>
            <h1 className="font-(family-name:--serif) text-3xl text-foreground sm:text-4xl">
              Your weddings
            </h1>
            <p className="mt-2 text-xs text-foreground/60">
              Signed in as {user.email}
              {user.role === "SUPER_ADMIN" && !user.impersonatorId && (
                <>
                  {" · "}
                  <Link href="/super" className="underline hover:text-burnt-orange">
                    Super admin
                  </Link>
                </>
              )}
            </p>
          </div>
          <form action={logout}>
            <SignOutButton />
          </form>
        </div>

        <Link
          href="/dashboard/new"
          className="mt-8 inline-block bg-burnt-orange px-5 py-2.5 text-xs font-medium text-ivory hover:bg-burnt-orange-dark"
        >
          Create a wedding
        </Link>

        {weddings.length === 0 ? (
          <p className="mt-10 text-foreground/70">
            No weddings yet. Create one to get your site and dashboard.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {weddings.map((wedding) => (
              <li
                key={wedding.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 shadow-[0_18px_40px_-20px_rgb(var(--ink)/0.45)]"
              >
                <div>
                  <Link
                    href={dashboardPath(wedding.id)}
                    className="font-(family-name:--serif) text-xl text-foreground hover:text-burnt-orange"
                  >
                    {wedding.story
                      ? `${wedding.story.brideName} & ${wedding.story.groomName}`
                      : wedding.slug}
                  </Link>
                  <p className="mt-1 text-xs text-foreground/60">
                    {guestPath(wedding.slug)} · {STATUS_LABELS[wedding.status]}
                  </p>
                </div>
                <Link
                  href={dashboardPath(wedding.id)}
                  className="border border-olive/30 px-4 py-2 text-xs font-medium text-foreground hover:border-burnt-orange hover:text-burnt-orange"
                >
                  Manage
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
