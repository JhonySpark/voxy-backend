-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_isSuspended_idx" ON "User"("isSuspended");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_ageClassification_idx" ON "User"("ageClassification");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmailVerification_email_createdAt_idx" ON "EmailVerification"("email", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Friendship_friendId_status_idx" ON "Friendship"("friendId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Friendship_userId_status_idx" ON "Friendship"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Server_ownerId_idx" ON "Server"("ownerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Server_deletedAt_isSuspended_idx" ON "Server"("deletedAt", "isSuspended");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Server_createdAt_idx" ON "Server"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChannelMessage_senderId_idx" ON "ChannelMessage"("senderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChannelMessage_createdAt_idx" ON "ChannelMessage"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ModerationReport_status_createdAt_idx" ON "ModerationReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ModerationReport_createdAt_idx" ON "ModerationReport"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CosmeticItem_isAvailable_isDefault_idx" ON "CosmeticItem"("isAvailable", "isDefault");

