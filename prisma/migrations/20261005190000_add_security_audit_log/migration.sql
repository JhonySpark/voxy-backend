-- CreateEnum
CREATE TYPE "AuditLogAction" AS ENUM ('SERVER_CREATED', 'STREAM_STARTED', 'MEMBER_MUTED', 'MEMBER_UNMUTED', 'MEMBER_KICKED', 'MEMBER_BANNED', 'MEMBER_UNBANNED', 'REPORT_CREATED', 'REPORT_RESOLVED', 'SERVER_SUSPENDED', 'SERVER_UNSUSPENDED', 'USER_SUSPENDED', 'USER_UNSUSPENDED');

-- CreateTable
CREATE TABLE "SecurityAuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditLogAction" NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "serverId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityAuditLog_action_idx" ON "SecurityAuditLog"("action");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_actorId_idx" ON "SecurityAuditLog"("actorId");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_targetId_idx" ON "SecurityAuditLog"("targetId");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_serverId_idx" ON "SecurityAuditLog"("serverId");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_createdAt_idx" ON "SecurityAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "SecurityAuditLog" ADD CONSTRAINT "SecurityAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAuditLog" ADD CONSTRAINT "SecurityAuditLog_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;
