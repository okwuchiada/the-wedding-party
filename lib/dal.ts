import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { decrypt, getSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { scopedPrisma } from "@/lib/db-scoped";
import { can, isStaff, type Permission } from "@/lib/permissions";

export const LOGIN_PATH = "/login";
/** Where anyone holding a temporary password is sent until they choose their own. */
export const CHANGE_PASSWORD_PATH = "/change-password";

/**
 * The signed-in user, re-read from the database on every request so deleted
 * users, role changes and password resets take effect immediately. Never redirects.
 */
export const getCurrentUser = cache(async () => {
  const session = await decrypt(await getSessionCookie());
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, sessionVersion: true, mustChangePassword: true },
  });
  if (!user || user.sessionVersion !== session.sv) return null;

  // An impersonation session is only valid while the impersonator may still impersonate.
  if (session.impersonatorId) {
    const impersonator = await prisma.user.findUnique({
      where: { id: session.impersonatorId },
      select: { role: true },
    });
    if (!can(impersonator?.role, "user.impersonate")) return null;
  }

  return { ...user, impersonatorId: session.impersonatorId ?? null };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export const verifySession = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  // Nothing else until a temporary password is replaced (not while staff "view as" them).
  if (user.mustChangePassword && !user.impersonatorId) redirect(CHANGE_PASSWORD_PATH);
  return user;
});

/** Staff console gate: 404s for anyone without the permission (couples included). */
export async function requirePermission(permission: Permission) {
  const user = await verifySession();
  if (!can(user.role, permission)) notFound();
  return user;
}

const getMembership = cache(async (weddingId: string, userId: string) =>
  prisma.weddingMember.findUnique({ where: { weddingId_userId: { weddingId, userId } } })
);

/**
 * view: see the dashboard. edit: change content (editor-level).
 * owner: settings, members, publishing and billing.
 */
export type WeddingAccess = "view" | "edit" | "owner";

const STAFF_PERMISSION: Record<WeddingAccess, Permission> = {
  view: "wedding.view",
  edit: "wedding.edit",
  owner: "wedding.manage",
};

/**
 * Whether the current user may act on this wedding at `level`. Couples need a
 * membership (OWNER for owner-level); staff need the matching permission.
 */
export async function canManageWedding(weddingId: string, level: WeddingAccess = "edit") {
  const user = await getCurrentUser();
  if (!user) return false;
  if (can(user.role, STAFF_PERMISSION[level])) return true;

  const membership = await getMembership(weddingId, user.id);
  if (!membership) return false;
  return level !== "owner" || membership.role === "OWNER";
}

/**
 * Gate for every admin page and action: requires a session with access to the
 * wedding and returns it along with a client scoped to its rows. When staff
 * change a wedding they don't belong to, the change is logged under their name.
 */
export const requireWeddingAccess = cache(
  async (weddingId: string, level: WeddingAccess = "edit", auditAction?: string) => {
    const user = await verifySession();

    if (typeof weddingId !== "string" || !weddingId) notFound();
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      include: { plan: true },
    });
    if (!wedding || !(await canManageWedding(wedding.id, level))) notFound();

    const asStaff = isStaff(user.role) && !(await getMembership(wedding.id, user.id));
    if (asStaff && level !== "view" && auditAction) {
      await audit(user.id, `staff.${auditAction}`, { weddingId: wedding.id, meta: { role: user.role } });
    }

    return { user, wedding, db: scopedPrisma(wedding.id), asStaff };
  }
);
