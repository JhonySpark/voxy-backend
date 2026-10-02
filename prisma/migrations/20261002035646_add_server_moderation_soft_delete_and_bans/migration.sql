-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ServerBan" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServerBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerRolePermission" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "canInvite" BOOLEAN NOT NULL DEFAULT true,
    "canDeleteMessages" BOOLEAN NOT NULL DEFAULT false,
    "canKickMembers" BOOLEAN NOT NULL DEFAULT false,
    "canBanMembers" BOOLEAN NOT NULL DEFAULT false,
    "canManageChannels" BOOLEAN NOT NULL DEFAULT false,
    "canManageServer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServerBan_serverId_idx" ON "ServerBan"("serverId");

-- CreateIndex
CREATE INDEX "ServerBan_userId_idx" ON "ServerBan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ServerBan_serverId_userId_key" ON "ServerBan"("serverId", "userId");

-- CreateIndex
CREATE INDEX "ServerRolePermission_serverId_idx" ON "ServerRolePermission"("serverId");

-- CreateIndex
CREATE UNIQUE INDEX "ServerRolePermission_serverId_role_key" ON "ServerRolePermission"("serverId", "role");

-- AddForeignKey
ALTER TABLE "ServerBan" ADD CONSTRAINT "ServerBan_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerBan" ADD CONSTRAINT "ServerBan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerRolePermission" ADD CONSTRAINT "ServerRolePermission_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
