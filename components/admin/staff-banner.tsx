import Link from "next/link";
import { ROLE_LABELS, type Role } from "@/lib/permissions";

/** Shown when staff open a wedding they aren't a member of. */
export default function StaffBanner({ role, readOnly, consoleHref }: { role: string; readOnly: boolean; consoleHref: string }) {
  return (
    <div className="mx-auto mb-2 max-w-6xl px-5 sm:px-8">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[6px] bg-gold/20 px-4 py-2.5 text-sm">
        <span className="font-semibold">Staff access ({ROLE_LABELS[role as Role] ?? role})</span>
        <span className="text-ink/75">
          {readOnly
            ? "You can look around but not change anything."
            : "Changes you make are saved to the couple's site and logged under your name."}
        </span>
        <Link href={consoleHref} className="font-medium underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
          Case notes
        </Link>
      </p>
    </div>
  );
}
