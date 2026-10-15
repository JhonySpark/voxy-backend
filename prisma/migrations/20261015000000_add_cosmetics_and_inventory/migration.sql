-- AlterTable
ALTER TABLE "User" ADD COLUMN "equippedFrameSlug" TEXT;

-- CreateEnum
CREATE TYPE "CosmeticType" AS ENUM ('AVATAR_FRAME', 'PROFILE_EFFECT', 'NAMEPLATE', 'BADGE');

-- CreateEnum
CREATE TYPE "CosmeticRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateTable
CREATE TABLE "CosmeticItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CosmeticType" NOT NULL DEFAULT 'AVATAR_FRAME',
    "rarity" "CosmeticRarity" NOT NULL DEFAULT 'COMMON',
    "assetUrl" TEXT NOT NULL,
    "previewUrl" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CosmeticItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCosmetic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cosmeticItemId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCosmetic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CosmeticItem_slug_key" ON "CosmeticItem"("slug");

-- CreateIndex
CREATE INDEX "CosmeticItem_type_idx" ON "CosmeticItem"("type");

-- CreateIndex
CREATE INDEX "CosmeticItem_rarity_idx" ON "CosmeticItem"("rarity");

-- CreateIndex
CREATE INDEX "UserCosmetic_userId_idx" ON "UserCosmetic"("userId");

-- CreateIndex
CREATE INDEX "UserCosmetic_cosmeticItemId_idx" ON "UserCosmetic"("cosmeticItemId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCosmetic_userId_cosmeticItemId_key" ON "UserCosmetic"("userId", "cosmeticItemId");

-- AddForeignKey
ALTER TABLE "UserCosmetic" ADD CONSTRAINT "UserCosmetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCosmetic" ADD CONSTRAINT "UserCosmetic_cosmeticItemId_fkey" FOREIGN KEY ("cosmeticItemId") REFERENCES "CosmeticItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
