import { Injectable, Inject, Optional, ForbiddenException } from '@nestjs/common';
import {
  SECURITY_AUDIT_LOG_REPOSITORY,
  type ISecurityAuditLogRepository,
  type AuditLogFilter,
  type SecurityAuditLogWithActor,
} from '../core/ports/repositories/security-audit-log.repository.port.js';
import { SecurityAuditLog } from '../modules/moderation/domain/entities/security-audit-log.entity.js';
import { AuditLogActionEnum } from '../core/enums/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BetterStackLoggerService } from '../infrastructure/logging/better-stack-logger.service.js';

export interface RecordAuditLogDto {
  action: AuditLogActionEnum;
  actorId: string;
  targetType: string;
  targetId?: string | null;
  serverId?: string | null;
  reason?: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class SecurityAuditService {
  constructor(
    @Inject(SECURITY_AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: ISecurityAuditLogRepository,
    private readonly prisma: PrismaService,
    @Optional() private readonly logger?: BetterStackLoggerService,
  ) {}

  async record(dto: RecordAuditLogDto): Promise<void> {
    try {
      const entityResult = SecurityAuditLog.create(dto);
      if (entityResult.isSuccess) {
        await this.auditRepo.save(entityResult.getValue());
      }

      // Espelhar telemetria no Better Stack / Console de forma assíncrona
      this.logger?.logBusinessEvent('SECURITY_AUDIT_LOG', {
        action: dto.action,
        actorId: dto.actorId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        serverId: dto.serverId,
        reason: dto.reason,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[SecurityAuditService] Erro ao gravar log de auditoria:', err);
    }
  }

  async getServerAuditLogs(
    serverId: string,
    requesterUserId: string,
    filter: Omit<AuditLogFilter, 'serverId'>,
  ): Promise<{ logs: SecurityAuditLogWithActor[]; total: number }> {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      select: { ownerId: true },
    });

    if (!server) {
      throw new ForbiddenException('Servidor não encontrado.');
    }

    if (server.ownerId !== requesterUserId) {
      const member = await this.prisma.serverMember.findUnique({
        where: { serverId_userId: { serverId, userId: requesterUserId } },
        select: { role: true },
      });

      if (!member || (member.role !== 'ADMIN' && member.role !== 'OWNER')) {
        const rolePerms = await this.prisma.serverRolePermission.findUnique({
          where: { serverId_role: { serverId, role: member?.role || 'MEMBER' } },
          select: { canManageServer: true },
        });

        if (!rolePerms?.canManageServer) {
          throw new ForbiddenException('Você não tem permissão para visualizar os logs de auditoria deste servidor.');
        }
      }
    }

    return this.auditRepo.findWithDetails({
      ...filter,
      serverId,
    });
  }

  async getGlobalAuditLogs(
    requesterUserId: string,
    filter: AuditLogFilter,
  ): Promise<{ logs: SecurityAuditLogWithActor[]; total: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: requesterUserId },
      select: { id: true, isSuspended: true },
    });

    if (!user || user.isSuspended) {
      throw new ForbiddenException('Acesso não autorizado aos registros de auditoria.');
    }

    return this.auditRepo.findWithDetails(filter);
  }
}
