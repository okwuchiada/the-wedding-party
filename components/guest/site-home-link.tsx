"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Links to the wedding site's home: /w/<slug> on Vowly's domain, / on a couple's own domain. */
export default function SiteHomeLink() {
  const match = usePathname().match(/^\/w\/[^/]+/);
  return (
    <Link href={match ? match[0] : "/"} className="guest-btn">
      Go to the wedding site
    </Link>
  );
}
