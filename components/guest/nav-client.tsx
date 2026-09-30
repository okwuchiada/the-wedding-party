"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function navLinks(basePath: string, show: { rsvp: boolean; registry: boolean; gallery: boolean }) {
  return [
    show.rsvp && { label: "RSVP", href: `${basePath}#rsvp` },
    show.registry && { label: "Registry", href: `${basePath}#registry` },
    show.gallery && { label: "Photos", href: `${basePath}/gallery` },
    { label: "Wishes", href: `${basePath}/wishes` },
  ].filter((link): link is { label: string; href: string } => Boolean(link));
}

export default function GuestNavClient({
  basePath,
  show,
  dateLabel,
  brideInitial,
  groomInitial,
}: {
  basePath: string;
  /** Links to sections the couple has switched off (or a photo wall that isn't open) are left out. */
  show: { rsvp: boolean; registry: boolean; gallery: boolean };
  dateLabel: string;
  brideInitial: string;
  groomInitial: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const links = navLinks(basePath, show);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-nav transition-[background-color,box-shadow] duration-300 ${
        scrolled ? "bg-ivory/90 shadow-sm backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="font-semibold tracking-tight text-foreground  flex items-baseline gap-10">
          <Link href={basePath} className="font-(family-name:--serif) text-[26px] font-semibold tracking-[.02em] transition-opacity hover:opacity-80">
            {brideInitial}
            <span className="text-burnt-orange">&amp;</span>
            {groomInitial}
          </Link>
          <span className="font-(family-name:--sans) text-[12px] tracking-[.3em] uppercase opacity-70">
            {dateLabel}
          </span>
        </div>

        <div className="hidden items-center gap-6 sm:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                link.label === "RSVP"
                  ? "bg-burnt-orange px-3 py-1.5 text-ivory hover:bg-burnt-orange-dark"
                  : "text-foreground hover:text-burnt-orange"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-11 w-11 items-center justify-center text-foreground sm:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-5 w-5"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-olive/20 bg-ivory sm:hidden">
          <div className="flex flex-col px-4 py-2">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base font-medium text-foreground transition-colors hover:text-burnt-orange"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
