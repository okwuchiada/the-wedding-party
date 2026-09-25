-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "availabilityMonths" INTEGER,
ADD COLUMN     "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "limitations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "maxUploads" INTEGER,
ADD COLUMN     "popular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "themes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN     "customDomain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Wedding_customDomain_key" ON "Wedding"("customDomain");
