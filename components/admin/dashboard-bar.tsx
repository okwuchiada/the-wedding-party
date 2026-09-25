import Link from "next/link";
import { BrandLink } from "@/components/marketing/shell";
import { logout } from "@/lib/actions/auth";

const linkClass = "rounded-full px-3 py-2 hover:bg-(--m-mist)";

/** Top bar for signed-in pages, matching the landing header. */
export default function DashboardBar({ showConsole = false }: { showConsole?: boolean }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <BrandLink href="/dashboard" />
      <nav className="flex items-center gap-1 text-sm font-medium whitespace-nowrap sm:gap-2">
        <Link href="/dashboard" className={`hidden sm:inline-block ${linkClass}`}>
          Your weddings
        </Link>
        {showConsole && (
          <Link href="/super" className={linkClass}>
            Staff console
          </Link>
        )}
        <form action={logout}>
          <button type="submit" className="rounded-full border border-(--m-ink)/25 px-4 py-2 hover:border-(--m-ink)">
            Sign out
          </button>
        </form>
      </nav>
    </header>
  );
}
