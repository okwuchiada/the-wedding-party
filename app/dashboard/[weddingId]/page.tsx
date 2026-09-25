import AdminHome from "@/components/admin/home";
import DashboardBar from "@/components/admin/dashboard-bar";
import StaffBanner from "@/components/admin/staff-banner";
import { can } from "@/lib/permissions";
import { canManageWedding, requireWeddingAccess } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { COPY_FIELDS } from "@/lib/copy";
import { upgradeCharge } from "@/lib/billing";
import { paystackConfigured } from "@/lib/paystack";
import { hasFeature, siteClosesAt } from "@/lib/plans";
import { getWeddingById, guestPath, moneyFormat } from "@/lib/tenant";
import { coupleTitle, resolveLayout } from "@/lib/layouts";
import { resolveTheme } from "@/lib/themes";
import { getCountries } from "@/lib/countries";
import { guestCapacity } from "@/lib/capacity";
import { tabFromParam } from "@/lib/dashboard-tabs";

export default async function WeddingDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ weddingId: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { weddingId } = await params;
  const { user, wedding, db, asStaff } = await requireWeddingAccess(weddingId, "view");
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
    canEdit,
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
    canManageWedding(wedding.id, "owner"),
    canManageWedding(wedding.id, "edit"),
    getWeddingById(wedding.id),
    prisma.plan.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { priceKobo: "asc" }] }),
    prisma.payment.findMany({ where: scope, include: { plan: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const paidKobo = payments.filter((p) => p.status === "SUCCESS").reduce((sum, p) => sum + p.amountKobo, 0);
  const copy = settings.copy;
  const initialTab = tabFromParam((await searchParams).tab, isOwner);

  return (
    <>
    <DashboardBar showConsole={can(user.role, "console.view") && !user.impersonatorId} />
    {asStaff && (
      <StaffBanner role={user.role} readOnly={!canEdit} consoleHref={`/super/weddings/${wedding.id}`} />
    )}
    <AdminHome
      weddingId={wedding.id}
      money={moneyFormat(wedding)}
      guestUrl={guestPath(wedding.slug)}
      coupleTitle={coupleTitle(story, resolveLayout(settings.theme).heroNames)}
      isOwner={isOwner}
      readOnly={!canEdit}
      design={{
        // Show what they saved even if their plan doesn't render it.
        theme: resolveTheme(settings.theme, true),
        layout: resolveLayout(settings.theme),
        emptySections: [
          storyBeats.length === 0 && "story",
          !story?.brideNote && !story?.groomNote && "notes",
          registryItems.length === 0 && "registry",
          !bankDetails?.account && "gift",
          !copy?.asoebiFabric && !story?.bridePhone && "asoebi",
        ].filter((id): id is string => Boolean(id)),
        allowCustom: hasFeature(wedding.plan, "customTheme"),
        allowedThemes: wedding.plan?.themes ?? [],
        planName: wedding.plan?.name ?? null,
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
        canCustomCredit: hasFeature(wedding.plan, "customCredit"),
        brandingRemoved: hasFeature(wedding.plan, "removeBranding"),
        // Plans are sorted cheapest first, so these are the cheapest upgrades that unlock each.
        brandingPlan: plans.find((p) => hasFeature(p, "removeBranding"))?.name ?? null,
        creditPlan: plans.find((p) => hasFeature(p, "customCredit"))?.name ?? null,
      }}
      billing={{
        currentPlan: wedding.plan
          ? {
              name: wedding.plan.name,
              comped: wedding.comped,
              free: wedding.plan.priceKobo === 0,
              closesAt: siteClosesAt(wedding.plan, story?.weddingDate)?.toISOString() ?? null,
            }
          : null,
        paymentsEnabled: paystackConfigured(),
        plans: plans.map((plan) => ({
          key: plan.key,
          name: plan.name,
          priceKobo: plan.priceKobo,
          tagline: plan.tagline,
          popular: plan.popular,
          highlights: plan.highlights,
          limitations: plan.limitations,
          // Free plans need no checkout; weddings start on them.
          chargeKobo: plan.priceKobo === 0 ? null : upgradeCharge(plan, wedding.plan, paidKobo),
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
        // Weddings from before the free plan join it when they publish.
        canPublish: Boolean(wedding.paidAt || wedding.comped || !wedding.plan || wedding.plan.priceKobo === 0),
        currency: wedding.currency,
        locale: wedding.locale,
        phoneCountryCode: wedding.phoneCountryCode,
        maxGuests: wedding.maxGuests,
        guestLimit: wedding.plan?.maxGuests ?? 10_000,
        allowedCountries: wedding.allowedCountries,
        geoBypassToken: isOwner ? wedding.geoBypassToken : null,
        countries: isOwner ? await getCountries() : [],
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
        reference: c.reference,
        dateRequested: c.createdAt.toISOString().slice(0, 10),
      }))}
      confirmedContributions={confirmedContributions.map((c) => ({
        id: c.id,
        guestName: c.guestName,
        itemName: c.registryItem.name,
        amountCents: c.amountCents,
        reference: c.reference,
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
        dateSubmitted: w.createdAt.toISOString().slice(0, 10),
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
      initialTab={initialTab}
      capacity={guestCapacity(wedding.maxGuests, wedding.plan?.maxGuests)}
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
    </>
  );
}
