-- CreateEnum
CREATE TYPE "AgeClassification" AS ENUM ('UNKNOWN', 'CHILD', 'TEEN', 'ADULT');

-- CreateEnum
CREATE TYPE "AgeSignalSource" AS ENUM ('NONE', 'WINDOWS_OS', 'DECLARED');

-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "is18Plus" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ageClassification" "AgeClassification" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "ageSignalCheckedAt" TIMESTAMP(3),
ADD COLUMN     "ageSignalSource" "AgeSignalSource" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EmailVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailVerification_email_idx" ON "EmailVerification"("email");
