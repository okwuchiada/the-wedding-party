import Link from "next/link";
import { redirect } from "next/navigation";
import AccountForm from "@/components/admin/account-form";
import DashboardBar from "@/components/admin/dashboard-bar";
import { verifySession } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/** A couple's own account details. Staff keep theirs under Staff console → My profile. */
export default async function AccountPage() {
  const me = await verifySession();
  const staff = can(me.role, "console.view") && !me.impersonatorId;
  if (staff) redirect("/super/profile");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: me.id }, select: { email: true, name: true, phone: true } });

  return (
    <>
      <DashboardBar />
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-5 pt-4 pb-20 sm:px-8">
        <Link href="/dashboard" className="self-start text-sm underline decoration-(--m-ink)/25 underline-offset-4 hover:decoration-(--m-ink)">
          Your weddings
        </Link>
        <div>
          <h1 className="font-(family-name:--m-display) text-4xl font-extrabold tracking-[-0.03em]">Your account</h1>
          <p className="mt-2 text-(--m-ink)/65">
            Your own details for signing in. The names on your wedding site are set in its Our Story tab.
          </p>
        </div>
        <AccountForm email={user.email} name={user.name ?? ""} phone={user.phone ?? ""} />
      </div>
    </>
  );
}
