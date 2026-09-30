import Link from "next/link";
import { redirect } from "next/navigation";
import AccountForm from "@/components/admin/account-form";
import DashboardBar from "@/components/admin/dashboard-bar";
import { verifySession } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { coupleTitle, resolveLayout } from "@/lib/layouts";
import { dashboardPath } from "@/lib/tenant";

/** A couple's own account details. Staff keep theirs under Staff console → My profile. */
export default async function AccountPage() {
  const me = await verifySession();
  const staff = can(me.role, "console.view") && !me.impersonatorId;
  if (staff) redirect("/super/profile");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: me.id }, select: { email: true, name: true, phone: true } });
  // With one wedding, "Your weddings" would bounce straight into it, so link there by name.
  const memberships = await prisma.weddingMember.findMany({
    where: { userId: me.id },
    take: 2,
    select: { wedding: { select: { id: true, slug: true, story: { select: { brideName: true, groomName: true } }, theme: { select: { heroNames: true } } } } },
  });
  const only = memberships.length === 1 ? memberships[0].wedding : null;
  const back = only
    ? { href: dashboardPath(only.id), label: `Back to ${coupleTitle(only.story, resolveLayout(only.theme).heroNames) ?? only.slug}` }
    : { href: "/dashboard", label: "Your weddings" };

  return (
    <>
      <DashboardBar />
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 pt-4 pb-20 sm:px-8">
        <Link href={back.href} className="self-start text-sm underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
          {back.label}
        </Link>
        <div>
          <h1 className="font-(family-name:--m-display) text-4xl font-extrabold tracking-[-0.03em]">Your account</h1>
          <p className="mt-2 text-ink/65">
            Your own details for signing in. The names on your wedding site are set in its Our Story tab.
          </p>
        </div>
        <AccountForm email={user.email} name={user.name ?? ""} phone={user.phone ?? ""} />
      </div>
    </>
  );
}
