-- AlterTable
ALTER TABLE "WeddingTheme" DROP COLUMN "heroImageUrl";

-- AlterTable
ALTER TABLE "WeddingCopy" ADD COLUMN     "footerCreditUrl" TEXT;


-- ─── Data: keep the original wedding looking exactly as before ─────────────
-- Its footer credit and asoebi WhatsApp button were hardcoded for everyone;
-- they now live in the wedding's own copy settings.
INSERT INTO "WeddingCopy" ("id", "weddingId", "footerCredit", "footerCreditUrl", "asoebiEnabled")
SELECT 'copy_legacy', "id", 'Salem', 'https://adaokwuchi.dev', true
FROM "Wedding" WHERE "id" = 'wedding_legacy'
ON CONFLICT ("weddingId") DO NOTHING;

-- The hero image was hardcoded to this file; other weddings no longer default to it.
UPDATE "StoryContent" SET "heroPhotoUrl" = '/images/hero.jpg'
WHERE "weddingId" = 'wedding_legacy' AND "heroPhotoUrl" IS NULL;
