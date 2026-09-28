import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Prisma's defaults (2s to start, 5s to run) are too short for a serverless
    // Postgres like Neon waking up: transactions failed with "Unable to start a
    // transaction in the given time", which silently blocked payment fulfilment.
    transactionOptions: { maxWait: 15_000, timeout: 20_000 },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
