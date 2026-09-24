import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { decrypt, getSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scopedPrisma } from "@/lib/db-scoped";
import type { WeddingRole } from "@/lib/generated/prisma/client";

export const LOGIN_PATH = "/login";

/**
 * The signed-in user, re-read from the database on every request so deleted
 * users, role changes and password resets take effect immediately. Never redirects.
 */
export const getCurrentUser = cache(async () => {
  const session = await decrypt(await getSessionCookie());
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, sessionVersion: true },
  });
  if (!user || user.sessionVersion !== session.sv) return null;

  // An impersonation session is only valid while the impersonator is still a super admin.
  if (session.impersonatorId) {
    const impersonator = await prisma.user.findUnique({
      where: { id: session.impersonatorId },
      select: { role: true },
    });
    if (impersonator?.role !== "SUPER_ADMIN") return null;
  }

  return { ...user, impersonatorId: session.impersonatorId ?? null };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export const verifySession = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  return user;
});

export async function requireSuperAdmin() {
  const user = await verifySession();
  if (user.role !== "SUPER_ADMIN") notFound();
  return user;
}

const getMembership = cache(async (weddingId: string, userId: string) =>
  prisma.weddingMember.findUnique({ where: { weddingId_userId: { weddingId, userId } } })
);

/**
 * Whether the current user may manage this wedding: super admins manage every
 * wedding; couples need a membership, and OWNER for owner-only actions.
 */
export async function canManageWedding(weddingId: string, minRole: WeddingRole = "EDITOR") {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;

  const membership = await getMembership(weddingId, user.id);
  if (!membership) return false;
  return minRole === "EDITOR" || membership.role === "OWNER";
}

/**
 * Gate for every admin page and action: requires a session with access to the
 * wedding and returns it along with a client scoped to its rows.
 */
export const requireWeddingAccess = cache(
  async (weddingId: string, minRole: WeddingRole = "EDITOR") => {
    const user = await verifySession();

    if (typeof weddingId !== "string" || !weddingId) notFound();
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      include: { plan: true },
    });
    if (!wedding || !(await canManageWedding(wedding.id, minRole))) notFound();

    return { user, wedding, db: scopedPrisma(wedding.id) };
  }
);
