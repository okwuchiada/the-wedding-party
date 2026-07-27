-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('AWAITING_CONFIRMATION', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "WishStatus" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN');

-- CreateTable
CREATE TABLE "RegistryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "externalUrl" TEXT,
    "claimedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "registryItemId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "note" TEXT,
    "status" "ContributionStatus" NOT NULL DEFAULT 'AWAITING_CONFIRMATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wish" (
    "id" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "WishStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryContent" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "brideName" TEXT NOT NULL,
    "groomName" TEXT NOT NULL,
    "weddingDate" TIMESTAMP(3) NOT NULL,
    "howWeMet" TEXT,
    "whatWeLove" TEXT,
    "heroPhotoUrl" TEXT,
    "storyPhotoUrls" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryContent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_registryItemId_fkey" FOREIGN KEY ("registryItemId") REFERENCES "RegistryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
