import Link from "next/link";
import { BrandLink } from "@/components/marketing/shell";
import { buttonClass } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";

const linkClass = "rounded-full px-3 py-2 hover:bg-line";

/** Top bar for signed-in pages, matching the landing header. */
export default function DashboardBar({ showConsole = false }: { showConsole?: boolean }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <BrandLink href="/dashboard" />
      <nav className="flex items-center gap-1 text-sm font-medium whitespace-nowrap sm:gap-2">
        {/* Staff keep their details in the console; couples on their account page. */}
        <Link href={showConsole ? "/super/profile" : "/dashboard/account"} className={linkClass}>
          {showConsole ? "My profile" : "Account"}
        </Link>
        <form action={logout}>
          <button type="submit" className={buttonClass("secondary", "sm")}>
            Sign out
          </button>
        </form>
      </nav>
    </header>
  );
}
