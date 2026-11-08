-- AlterTable
ALTER TABLE "Channel" ADD COLUMN "icon" TEXT DEFAULT 'hash',
ADD COLUMN "isRestricted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "allowedRoles" TEXT[] DEFAULT ARRAY[]::TEXT[];

