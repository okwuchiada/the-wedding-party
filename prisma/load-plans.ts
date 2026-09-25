// One-time switch to Vowly's plan line-up (npm run plans:load): writes Free, Signature and
// Forever from plan-catalog.ts, retires Basic and Premium (weddings on them keep what they
// paid for) and moves weddings with no plan onto Free. It overwrites those three plans, so
// after the first run edit plans in the staff console (/super/plans) instead.
// Needs the 20260930100000_plan_terms migration: run `npx prisma migrate deploy` first.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PLAN_CATALOG, RETIRED_PLAN_KEYS } from "./plan-catalog";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  await prisma.$transaction(
    async (tx) => {
      for (const plan of PLAN_CATALOG) {
        await tx.plan.upsert({ where: { key: plan.key }, update: plan, create: plan });
      }
      // Retired plans stop selling; weddings on them keep what they paid for, now spelled out
      // in the finer-grained features (videos came with the gallery, a custom credit with removeBranding).
      for (const key of RETIRED_PLAN_KEYS) {
        const old = await tx.plan.findUnique({ where: { key } });
        if (!old) continue;
        const f = (old.features ?? {}) as Record<string, boolean>;
        await tx.plan.update({
          where: { key },
          data: { active: false, popular: false, features: { ...f, video: f.gallery === true, customCredit: f.removeBranding === true } },
        });
      }
      const free = await tx.plan.findUniqueOrThrow({ where: { key: "free" } });
      const orphans = await tx.wedding.findMany({ where: { planId: null }, select: { id: true, slug: true, maxGuests: true, status: true } });
      for (const w of orphans) {
        await tx.wedding.update({ where: { id: w.id }, data: { planId: free.id, maxGuests: Math.min(w.maxGuests, free.maxGuests) } });
      }
      console.log("moved to Free:", orphans.map((w) => `${w.slug} (${w.status.toLowerCase()})`).join(", ") || "none");
    },
    { maxWait: 20_000, timeout: 60_000 }
  );

  const plans = await prisma.plan.findMany({ orderBy: [{ active: "desc" }, { sortOrder: "asc" }], include: { _count: { select: { weddings: true } } } });
  console.table(plans.map((p) => ({ key: p.key, name: p.name, naira: p.priceKobo / 100, onSale: p.active, popular: p.popular, guests: p.maxGuests, uploads: p.maxUploads, months: p.availabilityMonths, themes: p.themes.length || "all", weddings: p._count.weddings })));
  const over = await prisma.$queryRaw<{ slug: string; guests: bigint; cap: number }[]>`
    select w.slug, coalesce(sum(r."guestCount"), 0) as guests, least(w."maxGuests", p."maxGuests") as cap
    from "Wedding" w join "Plan" p on p.id = w."planId" left join "Rsvp" r on r."weddingId" = w.id
    group by w.slug, w."maxGuests", p."maxGuests" having coalesce(sum(r."guestCount"), 0) > least(w."maxGuests", p."maxGuests")`;
  console.log("weddings already over their guest cap:", over.length ? over.map((o) => `${o.slug} ${o.guests}/${o.cap}`).join(", ") : "none");
}
main()
  .catch((err) => {
    if (err?.code === "P2022") console.error("The plan columns are missing. Run `npx prisma migrate deploy` first, then try again.");
    else console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
