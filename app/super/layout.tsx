import Link from "next/link";
import DashboardBar from "@/components/admin/dashboard-bar";
import { BRAND_CLASS, BRAND_STYLE } from "@/components/marketing/brand";
import SuperNav from "@/components/super/nav";
import { requireSuperAdmin } from "@/lib/dal";

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireSuperAdmin();

  return (
    <div style={BRAND_STYLE} className={`${BRAND_CLASS} min-h-screen`}>
      <DashboardBar isSuperAdmin />
      <div className="mx-auto max-w-6xl px-5 pt-4 pb-16 sm:px-8">
        <h1 className="font-(family-name:--m-display) text-4xl leading-none font-extrabold tracking-[-0.03em] sm:text-5xl">
          Super admin
        </h1>
        <p className="mt-3 text-(--m-ink)/65">
          Signed in as {admin.email}.{" "}
          <Link href="/dashboard" className="underline decoration-(--m-ink)/25 underline-offset-4 hover:decoration-(--m-ink)">
            Your weddings
          </Link>
        </p>
        <div className="mt-8">
          <SuperNav />
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
