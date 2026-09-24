"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/super", label: "Overview" },
  { href: "/super/weddings", label: "Weddings" },
  { href: "/super/users", label: "Users" },
  { href: "/super/payments", label: "Payments" },
  { href: "/super/plans", label: "Plans" },
];

export default function SuperNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-olive/20">
      {LINKS.map((link) => {
        const active = link.href === "/super" ? pathname === "/super" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`-mb-px border-b-2 px-4 py-3 text-xs font-semibold tracking-[.12em] whitespace-nowrap uppercase ${
              active ? "border-burnt-orange text-foreground" : "border-transparent text-foreground/45 hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
