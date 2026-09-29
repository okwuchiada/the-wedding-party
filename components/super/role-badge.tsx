import { ROLE_LABELS, type Role } from "@/lib/permissions";

// Strength of colour tracks how much the access level can do.
const ROLE_STYLES: Record<Role, string> = {
  USER: "bg-(--m-mist)/60 text-(--m-ink)/75",
  VIEWER: "bg-(--m-ink)/10 text-(--m-ink)",
  SUPPORT: "bg-(--m-emerald)/15 text-(--m-emerald)",
  ADMIN: "bg-(--m-gold)/35 text-(--m-ink)",
  SUPER_ADMIN: "bg-(--m-ink) text-(--m-paper)",
};

/** A colour-coded pill for a user's access level. */
export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${ROLE_STYLES[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
