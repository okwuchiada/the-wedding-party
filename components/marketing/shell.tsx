import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { BRAND_CLASS, BRAND_STYLE, WOVEN } from "./brand";

/** A thin band of cloth stripes, used as the brand mark and to top cards. */
export function WovenBand({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`flex overflow-hidden ${className}`}>
      {[...WOVEN, ...WOVEN].map((c, i) => (
        <span key={i} style={{ background: `var(${c})`, flexGrow: i % 3 === 0 ? 2 : 1 }} />
      ))}
    </span>
  );
}

/** The woven logo and wordmark, as used in every platform header. */
export function BrandLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Vowly, the wedding party"
      className="flex items-center gap-2.5 whitespace-nowrap"
    >
      <span aria-hidden className="flex h-9 overflow-hidden rounded-[3px]">
        {WOVEN.map((c) => (
          <span key={c} style={{ background: `var(${c})` }} className="w-1.5" />
        ))}
      </span>
      <span aria-hidden className="flex flex-col">
        <span className="font-(family-name:--m-display) text-xl leading-none font-bold tracking-tight sm:text-2xl">Vowly</span>
        <span className="mt-1 text-[11px] leading-none font-medium text-(--m-ink)/60 sm:text-xs">The wedding party</span>
      </span>
    </Link>
  );
}

export default async function MarketingShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div style={BRAND_STYLE} className={`${BRAND_CLASS} flex min-h-screen flex-col`}>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <BrandLink href="/" />
        <nav className="flex items-center gap-1 text-sm font-medium whitespace-nowrap sm:gap-3">
          <Link href="/pricing" className="rounded-full px-3 py-2 hover:bg-(--m-mist)">
            Pricing
          </Link>
          {user ? (
            <Link href="/dashboard" className="rounded-full bg-(--m-ink) px-4 py-2 text-(--m-paper) hover:bg-(--m-emerald)">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-2 hover:bg-(--m-mist)">
                Sign in
              </Link>
              <Link href="/signup" className="hidden rounded-full bg-(--m-ink) px-4 py-2 text-(--m-paper) hover:bg-(--m-emerald) sm:inline-block">
                Create your site
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-(--m-mist)">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-(--m-ink)/70 sm:px-8">
          <p>Vowly — wedding sites for couples and their guests.</p>
          <div className="flex gap-5">
            <Link href="/pricing" className="hover:text-(--m-ink)">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-(--m-ink)">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
