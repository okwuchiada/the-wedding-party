-- AlterTable
ALTER TABLE "WeddingTheme" ADD COLUMN     "heroLayout" TEXT,
ADD COLUMN     "layoutTemplate" TEXT NOT NULL DEFAULT 'classic',
ADD COLUMN     "sections" JSONB NOT NULL DEFAULT '[]';

