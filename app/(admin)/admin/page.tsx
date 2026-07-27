import AdminHome from "@/components/admin/home";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const [
    registryItems,
    pendingContributions,
    confirmedContributions,
    pendingWishes,
    approvedWishes,
    hiddenWishes,
    story,
    storyPhotos,
    pendingMedia,
    approvedMedia,
    hiddenMedia,
    rsvps,
    bankDetails,
  ] = await Promise.all([
    prisma.registryItem.findMany({
      include: { contributions: { where: { status: "CONFIRMED" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.contribution.findMany({
      where: { status: "AWAITING_CONFIRMATION" },
      include: { registryItem: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.contribution.findMany({
      where: { status: "CONFIRMED" },
      include: { registryItem: true },
      orderBy: { confirmedAt: "desc" },
    }),
    prisma.wish.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.wish.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wish.findMany({
      where: { status: "HIDDEN" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.storyContent.findUnique({ where: { id: "main" } }),
    prisma.storyPhoto.findMany({ orderBy: { order: "asc" } }),
    prisma.media.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.media.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.media.findMany({
      where: { status: "HIDDEN" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rsvp.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.bankDetails.findUnique({ where: { id: "main" } }),
  ]);

  return (
    <AdminHome
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
        howWeMet: story?.howWeMet ?? null,
        whatWeLove: story?.whatWeLove ?? null,
        groomNote: story?.groomNote ?? null,
        brideNote: story?.brideNote ?? null,
        heroPhotoUrl: story?.heroPhotoUrl ?? null,
        contactEmail: story?.contactEmail ?? null,
        galleryEnabled: story?.galleryEnabled ?? false,
      }}
      storyPhotos={storyPhotos}
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
        attending: r.attending,
        guestCount: r.guestCount,
        message: r.message,
        dateSubmitted: r.createdAt.toISOString().slice(0, 10),
      }))}
      bankDetails={
        bankDetails ?? { name: "", bank: "", account: "", routing: "" }
      }
    />
  );
}
