-- CreateTable
CREATE TABLE "StaffProfile" (
    "userId" TEXT NOT NULL,
    "preferredName" TEXT,
    "jobTitle" TEXT,
    "phone" TEXT,
    "dateOfBirth" DATE,
    "gender" TEXT,
    "nationality" TEXT,
    "addressLine" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "emergencyName" TEXT,
    "emergencyRelationship" TEXT,
    "emergencyPhone" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
