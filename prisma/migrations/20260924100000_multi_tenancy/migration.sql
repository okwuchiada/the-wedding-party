-- Multi-tenancy: introduces Wedding (the tenant), accounts, plans and payments, and
-- scopes every existing table to a wedding. Existing data is adopted as the first
-- wedding ("wedding_legacy", status ACTIVE, comped on the "legacy" plan, NG-only
-- like the old geo-block). Its slug is derived from the couple's first names:
--   SELECT slug FROM "Wedding" WHERE id = 'wedding_legacy';


-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "WeddingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WeddingRole" AS ENUM ('OWNER', 'EDITOR');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wedding" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "WeddingStatus" NOT NULL DEFAULT 'DRAFT',
    "planId" TEXT,
    "paidAt" TIMESTAMP(3),
    "comped" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "locale" TEXT NOT NULL DEFAULT 'en-NG',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "phoneCountryCode" TEXT NOT NULL DEFAULT '234',
    "maxGuests" INTEGER NOT NULL DEFAULT 100,
    "allowedCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "geoBypassToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingMember" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "WeddingRole" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeddingMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingTheme" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "presetKey" TEXT NOT NULL DEFAULT 'terracotta-olive',
    "colors" JSONB NOT NULL DEFAULT '{}',
    "serifFont" TEXT,
    "scriptFont" TEXT,
    "sansFont" TEXT,
    "heroImageUrl" TEXT,

    CONSTRAINT "WeddingTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingCopy" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "heroEyebrow" TEXT,
    "heroIntro" TEXT,
    "rsvpIntro" TEXT,
    "registryIntro" TEXT,
    "giftIntro" TEXT,
    "loveNotesIntro" TEXT,
    "galleryIntro" TEXT,
    "wishesIntro" TEXT,
    "footerCredit" TEXT,
    "asoebiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "asoebiFabric" TEXT,

    CONSTRAINT "WeddingCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceKobo" INTEGER NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "features" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amountKobo" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paystackPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "weddingId" TEXT,
    "action" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Wedding_slug_key" ON "Wedding"("slug");

-- CreateIndex
CREATE INDEX "WeddingMember_userId_idx" ON "WeddingMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingMember_weddingId_userId_key" ON "WeddingMember"("weddingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingTheme_weddingId_key" ON "WeddingTheme"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "WeddingCopy_weddingId_key" ON "WeddingCopy"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_key_key" ON "Plan"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Payment_weddingId_idx" ON "Payment"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_weddingId_createdAt_idx" ON "AuditLog"("weddingId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Wedding" ADD CONSTRAINT "Wedding_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingMember" ADD CONSTRAINT "WeddingMember_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingMember" ADD CONSTRAINT "WeddingMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingTheme" ADD CONSTRAINT "WeddingTheme_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingCopy" ADD CONSTRAINT "WeddingCopy_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Data: adopt the existing single wedding as the first tenant ───────────
-- Only runs when the database already holds wedding data (fresh databases get no rows).
INSERT INTO "Plan" ("id", "key", "name", "priceKobo", "maxGuests", "features", "active", "sortOrder", "updatedAt")
SELECT 'plan_legacy', 'legacy', 'Legacy', 0, 100000,
       '{"gallery": true, "customTheme": true, "removeBranding": true}'::jsonb, false, 99, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "StoryContent")
   OR EXISTS (SELECT 1 FROM "RegistryItem")
   OR EXISTS (SELECT 1 FROM "Rsvp")
   OR EXISTS (SELECT 1 FROM "Wish")
   OR EXISTS (SELECT 1 FROM "Media")
   OR EXISTS (SELECT 1 FROM "StoryPhoto")
   OR EXISTS (SELECT 1 FROM "StoryBeat")
   OR EXISTS (SELECT 1 FROM "BankDetails");

-- Slug is built from the couple's first names, e.g. "amara-and-david".
INSERT INTO "Wedding" ("id", "slug", "status", "planId", "paidAt", "comped", "maxGuests", "allowedCountries", "updatedAt")
SELECT 'wedding_legacy',
       COALESCE(
         NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(
           LOWER(SPLIT_PART(TRIM(sc."brideName"), ' ', 1) || '-and-' || SPLIT_PART(TRIM(sc."groomName"), ' ', 1)),
           '[^a-z0-9]+', '-', 'g')), 'and'),
         'our-wedding'),
       'ACTIVE', 'plan_legacy', CURRENT_TIMESTAMP, true, 100, ARRAY['NG'], CURRENT_TIMESTAMP
FROM "Plan" p
LEFT JOIN "StoryContent" sc ON sc."id" = 'main'
WHERE p."id" = 'plan_legacy';


-- AlterTable
ALTER TABLE "RegistryItem" ADD COLUMN     "weddingId" TEXT;

-- AlterTable
ALTER TABLE "Contribution" ADD COLUMN     "weddingId" TEXT;

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "weddingId" TEXT;

-- AlterTable
ALTER TABLE "Wish" ADD COLUMN     "weddingId" TEXT;

-- AlterTable
ALTER TABLE "StoryContent" ADD COLUMN     "weddingId" TEXT,
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Rsvp" ADD COLUMN     "weddingId" TEXT;

-- AlterTable
ALTER TABLE "StoryPhoto" ADD COLUMN     "weddingId" TEXT;

-- AlterTable
ALTER TABLE "StoryBeat" ADD COLUMN     "weddingId" TEXT;

-- AlterTable
ALTER TABLE "BankDetails" ADD COLUMN     "weddingId" TEXT,
ALTER COLUMN "id" DROP DEFAULT;

-- ─── Backfill weddingId on existing rows, then make it required ──────────
UPDATE "RegistryItem" SET "weddingId" = 'wedding_legacy' WHERE "weddingId" IS NULL;
UPDATE "Contribution" SET "weddingId" = 'wedding_legacy' WHERE "weddingId" IS NULL;
UPDATE "Media" SET "weddingId" = 'wedding_legacy' WHERE "weddingId" IS NULL;
UPDATE "Wish" SET "weddingId" = 'wedding_legacy' WHERE "weddingId" IS NULL;
UPDATE "StoryContent" SET "weddingId" = 'wedding_legacy' WHERE "weddingId" IS NULL;
UPDATE "Rsvp" SET "weddingId" = 'wedding_legacy' WHERE "weddingId" IS NULL;
UPDATE "StoryPhoto" SET "weddingId" = 'wedding_legacy' WHERE "weddingId" IS NULL;
UPDATE "StoryBeat" SET "weddingId" = 'wedding_legacy' WHERE "weddingId" IS NULL;
UPDATE "BankDetails" SET "weddingId" = 'wedding_legacy' WHERE "weddingId" IS NULL;

ALTER TABLE "RegistryItem" ALTER COLUMN "weddingId" SET NOT NULL;
ALTER TABLE "Contribution" ALTER COLUMN "weddingId" SET NOT NULL;
ALTER TABLE "Media" ALTER COLUMN "weddingId" SET NOT NULL;
ALTER TABLE "Wish" ALTER COLUMN "weddingId" SET NOT NULL;
ALTER TABLE "StoryContent" ALTER COLUMN "weddingId" SET NOT NULL;
ALTER TABLE "Rsvp" ALTER COLUMN "weddingId" SET NOT NULL;
ALTER TABLE "StoryPhoto" ALTER COLUMN "weddingId" SET NOT NULL;
ALTER TABLE "StoryBeat" ALTER COLUMN "weddingId" SET NOT NULL;
ALTER TABLE "BankDetails" ALTER COLUMN "weddingId" SET NOT NULL;

-- DropIndex
DROP INDEX "Rsvp_ipAddress_createdAt_idx";

-- CreateIndex
CREATE INDEX "RegistryItem_weddingId_idx" ON "RegistryItem"("weddingId");

-- CreateIndex
CREATE INDEX "Contribution_weddingId_idx" ON "Contribution"("weddingId");

-- CreateIndex
CREATE INDEX "Media_weddingId_idx" ON "Media"("weddingId");

-- CreateIndex
CREATE INDEX "Wish_weddingId_idx" ON "Wish"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryContent_weddingId_key" ON "StoryContent"("weddingId");

-- CreateIndex
CREATE INDEX "Rsvp_weddingId_createdAt_idx" ON "Rsvp"("weddingId", "createdAt");

-- CreateIndex
CREATE INDEX "Rsvp_weddingId_ipAddress_createdAt_idx" ON "Rsvp"("weddingId", "ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "StoryPhoto_weddingId_idx" ON "StoryPhoto"("weddingId");

-- CreateIndex
CREATE INDEX "StoryBeat_weddingId_idx" ON "StoryBeat"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "BankDetails_weddingId_key" ON "BankDetails"("weddingId");

-- AddForeignKey
ALTER TABLE "RegistryItem" ADD CONSTRAINT "RegistryItem_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wish" ADD CONSTRAINT "Wish_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryContent" ADD CONSTRAINT "StoryContent_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryPhoto" ADD CONSTRAINT "StoryPhoto_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryBeat" ADD CONSTRAINT "StoryBeat_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDetails" ADD CONSTRAINT "BankDetails_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
