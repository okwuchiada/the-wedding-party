import Link from "next/link";
import DashboardBar from "@/components/admin/dashboard-bar";
import { BRAND_CLASS, BRAND_STYLE } from "@/components/marketing/brand";
import SuperNav from "@/components/super/nav";
import { requirePermission } from "@/lib/dal";
import { can, ROLE_LABELS } from "@/lib/permissions";

export default async function StaffConsoleLayout({ children }: { children: React.ReactNode }) {
  const staff = await requirePermission("console.view");
  const links = [
    { href: "/super", label: "Overview" },
    { href: "/super/weddings", label: "Weddings" },
    { href: "/super/users", label: "Users" },
    { href: "/super/payments", label: "Payments" },
    ...(can(staff.role, "plans.manage") ? [{ href: "/super/plans", label: "Plans" }] : []),
    ...(can(staff.role, "staff.manage") ? [{ href: "/super/staff", label: "Staff" }] : []),
  ];

  return (
    <div style={BRAND_STYLE} className={`${BRAND_CLASS} min-h-screen`}>
      <DashboardBar showConsole />
      <div className="mx-auto max-w-6xl px-5 pt-4 pb-16 sm:px-8">
        <h1 className="font-(family-name:--m-display) text-4xl leading-none font-extrabold tracking-[-0.03em] sm:text-5xl">
          Staff console
        </h1>
        <p className="mt-3 text-(--m-ink)/65">
          Signed in as {staff.email} ({ROLE_LABELS[staff.role]}).{" "}
          {/* <Link href="/dashboard" className="underline decoration-(--m-ink)/25 underline-offset-4 hover:decoration-(--m-ink)">
            Your weddings
          </Link> */}
        </p>
        <div className="mt-8">
          <SuperNav links={links} />
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
