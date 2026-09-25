import "server-only";
import { prisma } from "@/lib/prisma";

/** The free plan every new wedding starts on: the first active plan that costs nothing. */
export async function getStarterPlan() {
  return prisma.plan.findFirst({
    where: { active: true, priceKobo: 0 },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}
