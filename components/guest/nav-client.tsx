"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { label: "RSVP", href: "/#rsvp" },
  { label: "Registry", href: "/#registry" },
  { label: "Gallery Wall", href: "/gallery" },
  { label: "Wall of Wishes", href: "/wishes" },
];

export default function GuestNavClient({
  dateLabel,
  brideInitial,
  groomInitial,
}: {
  dateLabel: string;
  brideInitial: string;
  groomInitial: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300 ${
        scrolled ? "bg-ivory/90 shadow-sm backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="font-semibold tracking-tight text-foreground  flex items-baseline gap-10">
          <Link
            href="/"
            className="transition-opacity hover:opacity-80"
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 600,
              fontSize: 26,
              letterSpacing: ".02em",
            }}
          >
            {brideInitial}
            <span style={{ color: "var(--burnt-orange)" }}>&amp;</span>
            {groomInitial}
          </Link>
          <span
            style={{
              fontFamily: "var(--sans)",
              fontSize: 10,
              letterSpacing: ".3em",
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          >
            {dateLabel}
          </span>
        </div>

        <div className="hidden items-center gap-6 sm:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-sans font-medium text-foreground transition-colors hover:text-burnt-orange ${link.label.toLowerCase() === 'rsvp' && 'text-ivory bg-burnt-orange px-3 py-1.5 hover:bg-burnt-orange-dark'}`}
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
          className="flex h-9 w-9 items-center justify-center text-foreground sm:hidden"
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
                className="py-3 text-sm font-sans font-medium text-foreground transition-colors hover:text-burnt-orange"
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
