import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { STORAGE_PORT } from '../../core/ports/storage.port.js';
import type { IStoragePort } from '../../core/ports/storage.port.js';

@Injectable()
export class ChatRetentionService {
  private readonly logger = new Logger(ChatRetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PORT) private readonly storagePort: IStoragePort,
  ) {}

  /**
   * Executa diariamente às 03:00 da manhã para limpar mensagens e anexos expirados
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleRetentionCleanup(): Promise<{
    deletedFiles: number;
    deletedDirectMessages: number;
    deletedChannelMessages: number;
  }> {
    const retentionDays = Number(process.env.CHAT_RETENTION_DAYS ?? 60);

    if (retentionDays <= 0) {
      this.logger.log('Limpeza automática de retenção desativada (CHAT_RETENTION_DAYS <= 0).');
      return { deletedFiles: 0, deletedDirectMessages: 0, deletedChannelMessages: 0 };
    }

    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    this.logger.log(
      `Iniciando limpeza de histórico de chat e arquivos mais antigos que ${retentionDays} dias (antes de ${cutoffDate.toISOString()})...`,
    );

    try {
      // 1. Encontrar todos os anexos associados a mensagens antes da data de corte
      const expiredAttachments = await this.prisma.attachment.findMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
        select: {
          id: true,
          fileKey: true,
          thumbnailKey: true,
        },
      });

      const fileKeysToDelete: string[] = [];
      for (const a of expiredAttachments) {
        if (a.fileKey) fileKeysToDelete.push(a.fileKey);
        if (a.thumbnailKey) fileKeysToDelete.push(a.thumbnailKey);
      }

      // 2. Apagar os arquivos do Cloudflare R2 em lote
      if (fileKeysToDelete.length > 0) {
        this.logger.log(
          `Deletando ${fileKeysToDelete.length} arquivos expirados do bucket Cloudflare R2...`,
        );
        await this.storagePort.deleteFiles(fileKeysToDelete);
      }

      // 3. Deletar as mensagens de canais expiradas
      const deletedChannelResult = await this.prisma.channelMessage.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      // 4. Deletar as mensagens diretas expiradas
      const deletedDirectResult = await this.prisma.message.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      // 5. Deletar anexos órfãos que possam ter sobrado
      await this.prisma.attachment.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(
        `Limpeza concluída com sucesso: ${fileKeysToDelete.length} arquivos removidos do R2, ` +
          `${deletedDirectResult.count} mensagens diretas e ${deletedChannelResult.count} mensagens de canal apagadas do banco de dados.`,
      );

      return {
        deletedFiles: fileKeysToDelete.length,
        deletedDirectMessages: deletedDirectResult.count,
        deletedChannelMessages: deletedChannelResult.count,
      };
    } catch (error) {
      this.logger.error(`Erro ao executar rotina de retenção: ${String(error)}`, (error as Error).stack);
      throw error;
    }
  }
}
