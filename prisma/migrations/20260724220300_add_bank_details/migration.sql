-- CreateTable
CREATE TABLE "BankDetails" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "name" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "routing" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankDetails_pkey" PRIMARY KEY ("id")
);
