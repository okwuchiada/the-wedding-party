import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { decrypt, getSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scopedPrisma } from "@/lib/db-scoped";

/** The current session, or null. Never redirects. */
export const getSession = cache(async () => {
  const session = await decrypt(await getSessionCookie());
  return session?.role ? session : null;
});

export const verifySession = cache(async () => {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  return { isAuth: true as const, role: session.role };
});

/**
 * Whether the current viewer may manage this wedding. The single admin
 * password manages every wedding until per-couple accounts land.
 */
export async function canManageWedding(weddingId: string) {
  void weddingId;
  return (await getSession()) !== null;
}

/**
 * Gate for every admin page and action: requires a session with access to the
 * wedding and returns it along with a client scoped to its rows.
 */
export const requireWeddingAccess = cache(async (weddingId: string) => {
  await verifySession();

  if (typeof weddingId !== "string" || !weddingId) notFound();
  const wedding = await prisma.wedding.findUnique({
    where: { id: weddingId },
    include: { plan: true },
  });
  if (!wedding || !(await canManageWedding(wedding.id))) notFound();

  return { wedding, db: scopedPrisma(wedding.id) };
});
