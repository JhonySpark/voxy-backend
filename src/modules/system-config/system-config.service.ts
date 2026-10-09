import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface AppStatusResponse {
  allowRegistrations: boolean;
  maxBetaUsers: number;
  currentUsers: number;
  remainingSlots: number;
  isBetaOpen: boolean;
  allowScreenShare: boolean;
  maxVoiceParticipantsPerRoom: number;
  maxScreenShareBitrateKbps: number;
  maintenanceNotice: string | null;
}

@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtém a configuração global do sistema gravada no banco.
   * Se o registro padrão ainda não existir, cria atomicamente com os valores padrão.
   */
  async getConfig() {
    try {
      let config = await this.prisma.systemConfig.findUnique({
        where: { id: 'default' },
      });

      if (!config) {
        config = await this.prisma.systemConfig.upsert({
          where: { id: 'default' },
          create: {
            id: 'default',
            allowRegistrations: true,
            maxBetaUsers: 50,
            allowScreenShare: true,
            maxVoiceParticipantsPerRoom: 8,
            maxScreenShareBitrateKbps: 2500,
            maintenanceNotice: null,
          },
          update: {},
        });
      }

      return config;
    } catch (err) {
      this.logger.warn(
        `Falha ao ler SystemConfig do banco, usando fallback seguro: ${err}`,
      );
      return {
        id: 'default',
        allowRegistrations: true,
        maxBetaUsers: 50,
        allowScreenShare: true,
        maxVoiceParticipantsPerRoom: 8,
        maxScreenShareBitrateKbps: 2500,
        maintenanceNotice: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Retorna o status de integridade e travas do app em tempo de execução
   * conforme a especificação do LAUNCH_ROLLOUT_PLAN.md (seção 3.1)
   */
  async getAppStatus(): Promise<AppStatusResponse> {
    const config = await this.getConfig();
    const currentUsers = await this.prisma.user.count();

    const isUnlimited = config.maxBetaUsers <= 0;
    const remainingSlots = isUnlimited
      ? 9999
      : Math.max(0, config.maxBetaUsers - currentUsers);
    const isBetaOpen =
      config.allowRegistrations && (isUnlimited || remainingSlots > 0);

    return {
      allowRegistrations: isBetaOpen,
      maxBetaUsers: isUnlimited ? 0 : config.maxBetaUsers,
      currentUsers,
      remainingSlots,
      isBetaOpen,
      allowScreenShare: config.allowScreenShare,
      maxVoiceParticipantsPerRoom: config.maxVoiceParticipantsPerRoom,
      maxScreenShareBitrateKbps: config.maxScreenShareBitrateKbps,
      maintenanceNotice: config.maintenanceNotice,
    };
  }

  /**
   * Atualiza as configurações no banco
   */
  async updateConfig(
    data: Partial<{
      allowRegistrations: boolean;
      maxBetaUsers: number;
      allowScreenShare: boolean;
      maxVoiceParticipantsPerRoom: number;
      maxScreenShareBitrateKbps: number;
      maintenanceNotice: string | null;
    }>,
  ) {
    return this.prisma.systemConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...data,
      },
      update: data,
    });
  }
}
