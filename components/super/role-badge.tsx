import { ROLE_LABELS, type Role } from "@/lib/permissions";

// Strength of colour tracks how much the access level can do.
const ROLE_STYLES: Record<Role, string> = {
  USER: "bg-line/60 text-ink/75",
  VIEWER: "bg-ink/10 text-ink",
  SUPPORT: "bg-success/15 text-success",
  ADMIN: "bg-action/35 text-ink",
  SUPER_ADMIN: "bg-ink text-paper",
};

/** A colour-coded pill for a user's access level. */
export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${ROLE_STYLES[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}
