import "server-only";
import { prisma } from "@/lib/prisma";
import { scopeArgs } from "@/lib/tenant-scope";

/**
 * A Prisma client whose tenant-model queries can only see and write rows of one
 * wedding. Callers still pass weddingId explicitly; this is the safety net for a
 * forgotten filter. See lib/tenant-scope.ts for the rules.
 */
export function scopedPrisma(weddingId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          return query(scopeArgs(model, operation, args, weddingId) as typeof args);
        },
      },
    },
  });
}

export type ScopedPrisma = ReturnType<typeof scopedPrisma>;
