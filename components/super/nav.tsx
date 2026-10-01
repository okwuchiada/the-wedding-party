"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SuperNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1">
      {links.map((link) => {
        const active = link.href === "/super" ? pathname === "/super" : pathname.startsWith(link.href);
        return (
          <Button
            key={link.href}
            asChild
            variant={active ? "ink" : "ghost"}
            size="sm"
            className={active ? "text-sm font-medium hover:bg-ink" : "text-sm text-ink/70 hover:text-ink"}
          >
            <Link href={link.href} aria-current={active ? "page" : undefined}>
              {link.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
