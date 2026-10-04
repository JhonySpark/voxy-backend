-- AlterTable
ALTER TABLE "ChannelMessage" ADD COLUMN     "replyToId" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "replyToId" TEXT;

-- CreateIndex
CREATE INDEX "ChannelMessage_replyToId_idx" ON "ChannelMessage"("replyToId");

-- CreateIndex
CREATE INDEX "Message_replyToId_idx" ON "Message"("replyToId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "ChannelMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
