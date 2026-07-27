import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const bride = "Amara";
const groom = "David";
const weddingDateISO = "2026-09-19T16:00:00Z"; // stored value is displayed as-is (UTC, no conversion)

const registryItems = [
  {
    id: "honeymoon-fund",
    name: "Honeymoon Fund",
    category: "Experiences",
    priceCents: 500_000_00,
    image: "https://images.unsplash.com/photo-1615966650071-855b15f29ad1?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aG9uZXltb29uJTIwY291cGxlfGVufDB8fDB8fHww",
    externalUrl: null as string | null,
    claimedBy: null as string | null,
    contributions: [
      { guestName: "Chioma", amountCents: 50_000_00 },
      { guestName: "Tunde", amountCents: 75_000_00 },
    ],
  },
  {
    id: "dinner-experience",
    name: "Dinner Experience",
    category: "Experiences",
    priceCents: 150_000_00,
    image: "https://images.unsplash.com/photo-1569929233287-f0565228c4d4?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGRpbm5lciUyMGRhdGV8ZW58MHx8MHx8fDA%3D",
    externalUrl: null as string | null,
    claimedBy: null as string | null,
    contributions: [{ guestName: "Ngozi", amountCents: 150_000_00 }],
  },
  {
    id: "stand-mixer",
    name: "Stand Mixer",
    category: "Kitchen",
    priceCents: 180_000_00,
    image: "https://images.unsplash.com/photo-1693875161720-b0c2401c1874?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c3RhbmQlMjBtaXhlcnxlbnwwfHwwfHx8MA%3D%3D",
    externalUrl: null as string | null,
    claimedBy: null as string | null,
    contributions: [],
  },
  {
    id: "dinnerware-set",
    name: "Dinnerware Set",
    category: "Kitchen",
    priceCents: 90_000_00,
    image: "https://images.unsplash.com/photo-1631008788127-57317667a0d2?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGRpbm5lcndhcmV8ZW58MHx8MHx8fDA%3D",
    externalUrl: null as string | null,
    claimedBy: null as string | null,
    contributions: [],
  },
  {
    id: "throw-blanket",
    name: "Throw Blanket",
    category: "Home",
    priceCents: 45_000_00,
    image: "https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dGhyb3clMjBibGFua2V0fGVufDB8fDB8fHww",
    externalUrl: null as string | null,
    claimedBy: "Funmi" as string | null,
    contributions: [],
  },
  {
    id: "cookware-set",
    name: "Cookware Set",
    category: "Home",
    priceCents: 220_000_00,
    image: "https://images.unsplash.com/photo-1556911164-1297abe8527c?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Y29va3dhcmUlMjBzZXR8ZW58MHx8MHx8fDA%3D",
    externalUrl: null as string | null,
    claimedBy: null as string | null,
    contributions: [],
  },
];

const pendingContributions = [
  { guestName: "Emeka", itemName: "Honeymoon Fund", amountCents: 100_000_00, dateRequested: "2026-06-01" },
  { guestName: "Adaeze", itemName: "Dinner Experience", amountCents: 50_000_00, dateRequested: "2026-06-03" },
];

const galleryImages = [
  { src: "https://images.unsplash.com/photo-1695719416493-95257680511f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHdlZGRpbmclMjBndWVzdHN8ZW58MHx8MHx8fDA%3D" },
  { src: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8d2VkZGluZyUyMGd1ZXN0c3xlbnwwfHwwfHx8MA%3D%3D" },
  { src: "https://images.unsplash.com/photo-1606216836560-25cf33c04b0d?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8d2VkZGluZyUyMGd1ZXN0c3xlbnwwfHwwfHx8MA%3D%3D" },
  { src: "https://images.unsplash.com/photo-1723373457175-31b09fa7d405?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHdlZGRpbmclMjBndWVzdHN8ZW58MHx8MHx8fDA%3D" },
  { src: "https://images.unsplash.com/photo-1552223412-61c0b0de9eb7?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHdlZGRpbmclMjBndWVzdHN8ZW58MHx8MHx8fDA%3D" },
  { src: "https://images.unsplash.com/photo-1758810411287-a362740f269e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fHdlZGRpbmclMjBndWVzdHN8ZW58MHx8MHx8fDA%3D" },
];

const pendingMedia = [
  { guestName: "Kemi", src: "https://picsum.photos/seed/pending-media-1/400/400", dateUploaded: "2026-06-02" },
  { guestName: "Seyi", src: "https://picsum.photos/seed/pending-media-2/400/400", dateUploaded: "2026-06-04" },
];

const wishes = [
  { guestName: "Ngozi", message: "Wishing you both a lifetime of love and laughter!" },
  { guestName: "Tunde", message: "So happy for you two — can't wait to celebrate with you!" },
  { guestName: "Chioma", message: "May your marriage be filled with joy, laughter, and adventure." },
  { guestName: "Funmi", message: "Congratulations! You two are perfect for each other." },
];

const pendingWishes = [
  { guestName: "Bola", message: "Wishing you endless happiness together!", dateSubmitted: "2026-06-01" },
  { guestName: "Ike", message: "Can't wait to dance at your wedding!", dateSubmitted: "2026-06-05" },
];

const bankDetails = {
  name: "Amara & David",
  bank: "Bank Name",
  account: "0000 0000 0000",
  routing: "000 000 000",
};

const storyPhotos = [
  { url: "/images/c1.jpg", caption: "The day we met, I knew my life was about to change for the better.", order: 0, showInHero: true },
  { url: "/images/c2.jpg", caption: "Every road trip with you turns into my favorite memory.", order: 1, showInHero: true },
  { url: "/images/c3.jpeg", caption: "You make the ordinary days feel like something worth celebrating.", order: 2, showInHero: true },
  { url: "/images/c4.jpg", caption: "Thank you for laughing with me at 2am over nothing at all.", order: 3, showInHero: false },
  { url: "/images/p1.jpg", caption: "The proposal, and the yes that started forever.", order: 4, showInHero: false },
  { url: "/images/p2.jpg", caption: "Building a home with you has been the easiest decision I've ever made.", order: 5, showInHero: false },
  { url: "/images/p3.jpg", caption: "Here's to the wedding day, and to every day after it.", order: 6, showInHero: false },
];

const groomNote =
  "From the day we met, I knew you were going to turn my whole life into something worth writing about. You have this way of making ordinary Tuesdays feel like an adventure, and your laugh is still my favorite sound in the world. Thank you for choosing me, for growing with me, and for saying yes to forever. I can't wait to spend every sunrise chasing this life with you by my side.";

const brideNote =
  "You are the calm in every storm and the reason I believe in soft, steady love. I love how you show up for the people you care about, how you make me laugh even on my hardest days, and how being with you always feels like home. Marrying you isn't the end of our story — it's just the beginning of the best chapter yet. I can't wait to call you my husband.";

async function main() {
  for (const item of registryItems) {
    await prisma.registryItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        name: item.name,
        category: item.category,
        priceCents: item.priceCents,
        image: item.image,
        externalUrl: item.externalUrl,
        claimedBy: item.claimedBy,
        contributions: {
          create: item.contributions.map((c) => ({
            guestName: c.guestName,
            amountCents: c.amountCents,
            status: "CONFIRMED",
            confirmedAt: new Date("2026-05-20"),
          })),
        },
      },
    });
  }

  for (const pc of pendingContributions) {
    const item = registryItems.find((i) => i.name === pc.itemName);
    if (!item) continue;
    await prisma.contribution.create({
      data: {
        registryItemId: item.id,
        guestName: pc.guestName,
        amountCents: pc.amountCents,
        status: "AWAITING_CONFIRMATION",
        createdAt: new Date(pc.dateRequested),
      },
    });
  }

  for (const image of galleryImages) {
    await prisma.media.create({
      data: {
        guestName: "The Couple",
        url: image.src,
        type: "PHOTO",
        status: "APPROVED",
      },
    });
  }

  for (const media of pendingMedia) {
    await prisma.media.create({
      data: {
        guestName: media.guestName,
        url: media.src,
        type: "PHOTO",
        status: "PENDING",
        createdAt: new Date(media.dateUploaded),
      },
    });
  }

  for (const wish of wishes) {
    await prisma.wish.create({
      data: {
        guestName: wish.guestName,
        message: wish.message,
        status: "APPROVED",
      },
    });
  }

  for (const wish of pendingWishes) {
    await prisma.wish.create({
      data: {
        guestName: wish.guestName,
        message: wish.message,
        status: "PENDING",
        createdAt: new Date(wish.dateSubmitted),
      },
    });
  }

  await prisma.storyContent.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      brideName: bride,
      groomName: groom,
      weddingDate: new Date(weddingDateISO),
      tagline: "A celebration of love",
      location: "The Grand Venue, 123 Main Street, Cityville",
      howWeMet: null,
      whatWeLove: null,
      groomNote,
      brideNote,
      heroPhotoUrl: null,
    },
  });

  const existingPhotoCount = await prisma.storyPhoto.count();
  if (existingPhotoCount === 0) {
    for (const photo of storyPhotos) {
      await prisma.storyPhoto.create({ data: photo });
    }
  }

  await prisma.bankDetails.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", ...bankDetails },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
