import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SystemConfigService } from './system-config.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('SystemConfigService', () => {
  let service: SystemConfigService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      systemConfig: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      user: {
        count: vi.fn(),
      },
    };

    service = new SystemConfigService(mockPrisma as PrismaService);
  });

  it('deve retornar a configuração existente do banco', async () => {
    mockPrisma.systemConfig.findUnique.mockResolvedValue({
      id: 'default',
      allowRegistrations: true,
      maxBetaUsers: 50,
      allowScreenShare: true,
      maxVoiceParticipantsPerRoom: 8,
      maxScreenShareBitrateKbps: 2500,
      maintenanceNotice: null,
    });

    const config = await service.getConfig();
    expect(config.maxBetaUsers).toBe(50);
    expect(config.allowRegistrations).toBe(true);
  });

  it('deve calcular status do app corretamente quando houver vagas', async () => {
    mockPrisma.systemConfig.findUnique.mockResolvedValue({
      id: 'default',
      allowRegistrations: true,
      maxBetaUsers: 50,
      allowScreenShare: true,
      maxVoiceParticipantsPerRoom: 8,
      maxScreenShareBitrateKbps: 2500,
      maintenanceNotice: null,
    });
    mockPrisma.user.count.mockResolvedValue(10);

    const status = await service.getAppStatus();
    expect(status.isBetaOpen).toBe(true);
    expect(status.currentUsers).toBe(10);
    expect(status.remainingSlots).toBe(40);
    expect(status.maxScreenShareBitrateKbps).toBe(2500);
  });

  it('deve fechar registros se o limite for atingido', async () => {
    mockPrisma.systemConfig.findUnique.mockResolvedValue({
      id: 'default',
      allowRegistrations: true,
      maxBetaUsers: 50,
      allowScreenShare: true,
      maxVoiceParticipantsPerRoom: 8,
      maxScreenShareBitrateKbps: 2500,
      maintenanceNotice: null,
    });
    mockPrisma.user.count.mockResolvedValue(50);

    const status = await service.getAppStatus();
    expect(status.isBetaOpen).toBe(false);
    expect(status.remainingSlots).toBe(0);
  });

  it('deve respeitar allowRegistrations = false mesmo que haja vagas', async () => {
    mockPrisma.systemConfig.findUnique.mockResolvedValue({
      id: 'default',
      allowRegistrations: false,
      maxBetaUsers: 50,
      allowScreenShare: true,
      maxVoiceParticipantsPerRoom: 8,
      maxScreenShareBitrateKbps: 2500,
      maintenanceNotice: 'Manutenção programada',
    });
    mockPrisma.user.count.mockResolvedValue(5);

    const status = await service.getAppStatus();
    expect(status.isBetaOpen).toBe(false);
    expect(status.allowRegistrations).toBe(false);
    expect(status.maintenanceNotice).toBe('Manutenção programada');
  });
});
