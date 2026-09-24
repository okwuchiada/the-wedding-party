-- Catch-up migration: brings migration history in line with schema changes that were
-- applied with `prisma db push`. Databases that already have these changes must mark this
-- migration as applied instead of running it:
--   npx prisma migrate resolve --applied 20260924000000_sync_schema

-- AlterTable
ALTER TABLE "StoryContent" DROP COLUMN "storyPhotoUrls",
ADD COLUMN     "brideNote" TEXT,
ADD COLUMN     "bridePhone" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "galleryEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "groomNote" TEXT,
ADD COLUMN     "groomPhone" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "venueAddress" TEXT;

-- AlterTable
ALTER TABLE "BankDetails" ADD COLUMN     "swift" TEXT;

-- CreateTable
CREATE TABLE "Rsvp" (
    "id" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "attending" BOOLEAN NOT NULL,
    "guestCount" INTEGER NOT NULL DEFAULT 1,
    "message" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmationSentAt" TIMESTAMP(3),

    CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryPhoto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "showInHero" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StoryPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryBeat" (
    "id" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "photoUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StoryBeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rsvp_ipAddress_createdAt_idx" ON "Rsvp"("ipAddress", "createdAt");

