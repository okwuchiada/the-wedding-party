import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export function audit(
  actorId: string | null,
  action: string,
  { weddingId, meta }: { weddingId?: string; meta?: Prisma.InputJsonValue } = {}
) {
  return prisma.auditLog.create({ data: { actorId, action, weddingId, meta } });
}
