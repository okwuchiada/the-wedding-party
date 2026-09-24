import Link from "next/link";
import SignOutButton from "@/components/admin/sign-out-button";
import SuperNav from "@/components/super/nav";
import { logout } from "@/lib/actions/auth";
import { requireSuperAdmin } from "@/lib/dal";

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-ivory px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-olive">Super admin</p>
            <h1 className="font-(family-name:--serif) text-3xl text-foreground">The Wedding Party</h1>
            <p className="mt-1 text-xs text-foreground/60">
              {admin.email} ·{" "}
              <Link href="/dashboard" className="underline hover:text-burnt-orange">
                My weddings
              </Link>
            </p>
          </div>
          <form action={logout}>
            <SignOutButton />
          </form>
        </div>
        <SuperNav />
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
