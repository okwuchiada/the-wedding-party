import AdminHome from "@/components/admin/home";
import { canManageWedding, requireWeddingAccess } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { COPY_FIELDS } from "@/lib/copy";
import { upgradeCharge } from "@/lib/billing";
import { paystackConfigured } from "@/lib/paystack";
import { hasFeature, type PlanFeature } from "@/lib/plans";
import { getWeddingById, guestPath, moneyFormat } from "@/lib/tenant";
import { resolveTheme } from "@/lib/themes";

export default async function WeddingDashboardPage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  const { user, wedding, db } = await requireWeddingAccess(weddingId);
  const scope = { weddingId: wedding.id };

  const [
    registryItems,
    pendingContributions,
    confirmedContributions,
    pendingWishes,
    approvedWishes,
    hiddenWishes,
    story,
    storyPhotos,
    storyBeats,
    pendingMedia,
    approvedMedia,
    hiddenMedia,
    rsvps,
    bankDetails,
    members,
    isOwner,
    settings,
    plans,
    payments,
  ] = await Promise.all([
    db.registryItem.findMany({
      where: scope,
      include: { contributions: { where: { ...scope, status: "CONFIRMED" } } },
      orderBy: { createdAt: "asc" },
    }),
    db.contribution.findMany({
      where: { ...scope, status: "AWAITING_CONFIRMATION" },
      include: { registryItem: true },
      orderBy: { createdAt: "asc" },
    }),
    db.contribution.findMany({
      where: { ...scope, status: "CONFIRMED" },
      include: { registryItem: true },
      orderBy: { confirmedAt: "desc" },
    }),
    db.wish.findMany({
      where: { ...scope, status: "PENDING" },
      orderBy: { createdAt: "asc" },
    }),
    db.wish.findMany({
      where: { ...scope, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    }),
    db.wish.findMany({
      where: { ...scope, status: "HIDDEN" },
      orderBy: { createdAt: "desc" },
    }),
    db.storyContent.findUnique({ where: scope }),
    db.storyPhoto.findMany({ where: scope, orderBy: { order: "asc" } }),
    db.storyBeat.findMany({ where: scope, orderBy: { order: "asc" } }),
    db.media.findMany({
      where: { ...scope, status: "PENDING" },
      orderBy: { createdAt: "asc" },
    }),
    db.media.findMany({
      where: { ...scope, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    }),
    db.media.findMany({
      where: { ...scope, status: "HIDDEN" },
      orderBy: { createdAt: "desc" },
    }),
    db.rsvp.findMany({ where: scope, orderBy: { createdAt: "desc" } }),
    db.bankDetails.findUnique({ where: scope }),
    prisma.weddingMember.findMany({
      where: scope,
      include: { user: { select: { email: true, name: true, passwordHash: true } } },
      orderBy: { createdAt: "asc" },
    }),
    canManageWedding(wedding.id, "OWNER"),
    getWeddingById(wedding.id),
    prisma.plan.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { priceKobo: "asc" }] }),
    prisma.payment.findMany({ where: scope, include: { plan: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const paidKobo = payments.filter((p) => p.status === "SUCCESS").reduce((sum, p) => sum + p.amountKobo, 0);
  const copy = settings.copy;

  return (
    <AdminHome
      weddingId={wedding.id}
      money={moneyFormat(wedding)}
      guestUrl={guestPath(wedding.slug)}
      isOwner={isOwner}
      design={{
        // Show what they saved even if their plan doesn't render it.
        theme: resolveTheme(settings.theme, true),
        allowCustom: hasFeature(wedding.plan, "customTheme"),
        isDraft: wedding.status === "DRAFT",
      }}
      copy={{
        ...(Object.fromEntries(COPY_FIELDS.map((f) => [f.key, copy?.[f.key] ?? null])) as Record<
          (typeof COPY_FIELDS)[number]["key"],
          string | null
        >),
        footerCredit: copy?.footerCredit ?? null,
        footerCreditUrl: copy?.footerCreditUrl ?? null,
        asoebiEnabled: copy?.asoebiEnabled ?? false,
        asoebiFabric: copy?.asoebiFabric ?? null,
        canRemoveBranding: hasFeature(wedding.plan, "removeBranding"),
      }}
      billing={{
        currentPlan: wedding.plan ? { name: wedding.plan.name, comped: wedding.comped } : null,
        paymentsEnabled: paystackConfigured(),
        plans: plans.map((plan) => ({
          key: plan.key,
          name: plan.name,
          priceKobo: plan.priceKobo,
          maxGuests: plan.maxGuests,
          features: (Object.keys(plan.features as object) as PlanFeature[]).filter((f) => hasFeature(plan, f)),
          chargeKobo: upgradeCharge(plan, wedding.plan, paidKobo),
          current: plan.id === wedding.planId,
        })),
        payments: payments
          .filter((p) => p.status !== "PENDING")
          .map((p) => ({
            reference: p.reference,
            planName: p.plan.name,
            amountKobo: p.amountKobo,
            status: p.status,
            date: (p.paidAt ?? p.createdAt).toISOString().slice(0, 10),
          })),
      }}
      settings={{
        slug: wedding.slug,
        status: wedding.status,
        canPublish: Boolean(wedding.paidAt || wedding.comped),
        currency: wedding.currency,
        locale: wedding.locale,
        phoneCountryCode: wedding.phoneCountryCode,
        maxGuests: wedding.maxGuests,
        guestLimit: wedding.plan?.maxGuests ?? 10_000,
        allowedCountries: wedding.allowedCountries,
        geoBypassToken: isOwner ? wedding.geoBypassToken : null,
      }}
      members={members.map((m) => ({
        id: m.id,
        email: m.user.email,
        name: m.user.name,
        role: m.role,
        pendingInvite: !m.user.passwordHash,
        isYou: m.userId === user.id,
      }))}
      registryItems={registryItems}
      pendingContributions={pendingContributions.map((c) => ({
        id: c.id,
        guestName: c.guestName,
        itemName: c.registryItem.name,
        amountCents: c.amountCents,
        dateRequested: c.createdAt.toISOString().slice(0, 10),
      }))}
      confirmedContributions={confirmedContributions.map((c) => ({
        id: c.id,
        guestName: c.guestName,
        itemName: c.registryItem.name,
        amountCents: c.amountCents,
        dateConfirmed: (c.confirmedAt ?? c.createdAt).toISOString().slice(0, 10),
      }))}
      pendingWishes={pendingWishes.map((w) => ({
        id: w.id,
        guestName: w.guestName,
        message: w.message,
        dateSubmitted: w.createdAt.toISOString().slice(0, 10),
      }))}
      approvedWishes={approvedWishes.map((w) => ({
        id: w.id,
        guestName: w.guestName,
        message: w.message,
      }))}
      hiddenWishes={hiddenWishes.map((w) => ({
        id: w.id,
        guestName: w.guestName,
        message: w.message,
        dateSubmitted: w.createdAt.toISOString().slice(0, 10),
      }))}
      story={{
        brideName: story?.brideName ?? "",
        groomName: story?.groomName ?? "",
        weddingDate: (story?.weddingDate ?? new Date()).toISOString().slice(0, 10),
        weddingTime: (story?.weddingDate ?? new Date()).toISOString().slice(11, 16),
        tagline: story?.tagline ?? null,
        location: story?.location ?? null,
        venueAddress: story?.venueAddress ?? null,
        howWeMet: story?.howWeMet ?? null,
        whatWeLove: story?.whatWeLove ?? null,
        groomNote: story?.groomNote ?? null,
        brideNote: story?.brideNote ?? null,
        heroPhotoUrl: story?.heroPhotoUrl ?? null,
        contactEmail: story?.contactEmail ?? null,
        bridePhone: story?.bridePhone ?? null,
        groomPhone: story?.groomPhone ?? null,
        galleryEnabled: story?.galleryEnabled ?? false,
      }}
      storyPhotos={storyPhotos}
      storyBeats={storyBeats}
      pendingMedia={pendingMedia.map((m) => ({
        id: m.id,
        guestName: m.guestName,
        url: m.url,
        type: m.type,
        dateUploaded: m.createdAt.toISOString().slice(0, 10),
      }))}
      approvedMedia={approvedMedia.map((m) => ({
        id: m.id,
        guestName: m.guestName,
        url: m.url,
        type: m.type,
        dateUploaded: m.createdAt.toISOString().slice(0, 10),
      }))}
      hiddenMedia={hiddenMedia.map((m) => ({
        id: m.id,
        guestName: m.guestName,
        url: m.url,
        type: m.type,
        dateUploaded: m.createdAt.toISOString().slice(0, 10),
      }))}
      rsvps={rsvps.map((r) => ({
        id: r.id,
        guestName: r.guestName,
        email: r.email,
        attending: r.attending,
        guestCount: r.guestCount,
        message: r.message,
        dateSubmitted: r.createdAt.toISOString().slice(0, 10),
        confirmationSentAt: r.confirmationSentAt
          ? r.confirmationSentAt.toISOString().slice(0, 10)
          : null,
      }))}
      bankDetails={
        bankDetails ?? { name: "", bank: "", account: "", routing: "", swift: null }
      }
    />
  );
}
