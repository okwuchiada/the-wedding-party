import AdminHome from "@/components/admin/home";
import { requireWeddingAccess } from "@/lib/dal";
import { guestPath } from "@/lib/tenant";

export default async function WeddingDashboardPage({
  params,
}: {
  params: Promise<{ weddingId: string }>;
}) {
  const { weddingId } = await params;
  const { wedding, db } = await requireWeddingAccess(weddingId);
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
  ]);

  return (
    <AdminHome
      weddingId={wedding.id}
      guestUrl={guestPath(wedding.slug)}
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
