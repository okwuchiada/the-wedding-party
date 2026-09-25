"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SuperNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1">
      {links.map((link) => {
        const active = link.href === "/super" ? pathname === "/super" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              active ? "bg-(--m-ink) text-(--m-paper)" : "text-(--m-ink)/70 hover:bg-(--m-mist) hover:text-(--m-ink)"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
