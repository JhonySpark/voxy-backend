-- CreateTable
CREATE TABLE IF NOT EXISTS "SystemConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "allowRegistrations" BOOLEAN NOT NULL DEFAULT true,
    "maxBetaUsers" INTEGER NOT NULL DEFAULT 50,
    "allowScreenShare" BOOLEAN NOT NULL DEFAULT true,
    "maxVoiceParticipantsPerRoom" INTEGER NOT NULL DEFAULT 10,
    "maxScreenShareBitrateKbps" INTEGER NOT NULL DEFAULT 12000,
    "maintenanceNotice" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- Inserir registro padrão se ainda não existir
INSERT INTO "SystemConfig" ("id", "allowRegistrations", "maxBetaUsers", "allowScreenShare", "maxVoiceParticipantsPerRoom", "maxScreenShareBitrateKbps", "updatedAt")
VALUES ('default', true, 50, true, 10, 12000, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
