-- Códigos curtos podem ser compartilhados sem expor o UUID interno do servidor.
ALTER TABLE "Server" ADD COLUMN "inviteCode" TEXT;

UPDATE "Server"
SET "inviteCode" = 'VOXY-' || upper(substr(replace("id", '-', ''), 1, 8));

ALTER TABLE "Server" ALTER COLUMN "inviteCode" SET NOT NULL;
CREATE UNIQUE INDEX "Server_inviteCode_key" ON "Server"("inviteCode");
