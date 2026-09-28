// Who on the platform team can do what. Couples are "USER"; everyone else is staff.

export const STAFF_ROLES = ["VIEWER", "SUPPORT", "ADMIN", "SUPER_ADMIN"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
export type Role = "USER" | StaffRole;

export const ROLE_LABELS: Record<Role, string> = {
  USER: "Couple",
  VIEWER: "Viewer",
  SUPPORT: "Support",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  VIEWER: "Read-only: can look up weddings, users and payments, and open dashboards without changing anything.",
  SUPPORT: "Helps couples: can edit wedding content, send reset links, re-check payments and leave notes.",
  ADMIN: "Runs operations: everything Support can do, plus settings, members, suspensions, comps and 'view as'.",
  SUPER_ADMIN: "Full access, including managing staff and plans.",
};

const ALL: readonly StaffRole[] = STAFF_ROLES;
const HELPERS: readonly StaffRole[] = ["SUPPORT", "ADMIN", "SUPER_ADMIN"];
const OPERATORS: readonly StaffRole[] = ["ADMIN", "SUPER_ADMIN"];
const SUPER: readonly StaffRole[] = ["SUPER_ADMIN"];

export const PERMISSIONS = {
  "console.view": ALL, // staff console: weddings, users, payments, activity
  "wedding.view": ALL, // open any couple's dashboard (read-only)
  "wedding.edit": HELPERS, // change a couple's content (editor-level)
  "wedding.manage": OPERATORS, // owner-level: settings, members, publishing
  "wedding.status": OPERATORS, // suspend, archive, restore
  "wedding.comp": OPERATORS, // grant or remove complimentary plans
  "user.reset": HELPERS, // email a password reset link
  "user.impersonate": OPERATORS, // "view as" a couple
  "payment.reverify": HELPERS, // ask Paystack about a payment again
  "payment.resolve": OPERATORS, // mark a payment paid by hand when Paystack's record can't be applied
  "notes.write": HELPERS, // internal notes on a wedding
  "staff.manage": SUPER, // add staff and change their roles
  "plans.manage": SUPER, // create and edit plans
} as const satisfies Record<string, readonly StaffRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function isStaff(role: string | null | undefined): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role ?? "");
}

export function can(role: string | null | undefined, permission: Permission) {
  return isStaff(role) && (PERMISSIONS[permission] as readonly string[]).includes(role);
}
