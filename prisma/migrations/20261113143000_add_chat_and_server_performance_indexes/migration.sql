-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_senderId_receiverId_createdAt_idx" ON "Message"("senderId", "receiverId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_receiverId_senderId_createdAt_idx" ON "Message"("receiverId", "senderId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ServerMember_userId_idx" ON "ServerMember"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Channel_serverId_idx" ON "Channel"("serverId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChannelMessage_channelId_createdAt_idx" ON "ChannelMessage"("channelId", "createdAt");

