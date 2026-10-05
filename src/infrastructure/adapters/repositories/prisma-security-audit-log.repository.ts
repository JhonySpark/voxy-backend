import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type {
  ISecurityAuditLogRepository,
  AuditLogFilter,
  SecurityAuditLogWithActor,
} from '../../../core/ports/repositories/security-audit-log.repository.port.js';
import { SecurityAuditLog } from '../../../modules/moderation/domain/entities/security-audit-log.entity.js';
import { AuditLogActionEnum } from '../../../core/enums/index.js';

@Injectable()
export class PrismaSecurityAuditLogRepository implements ISecurityAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(log: SecurityAuditLog): Promise<SecurityAuditLog> {
    const raw = await this.prisma.securityAuditLog.create({
      data: {
        id: log.id,
        action: log.action as any,
        actorId: log.actorId,
        targetType: log.targetType,
        targetId: log.targetId,
        serverId: log.serverId,
        reason: log.reason,
        metadata: (log.metadata as any) ?? undefined,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      },
    });

    const result = SecurityAuditLog.create(
      {
        action: raw.action as AuditLogActionEnum,
        actorId: raw.actorId,
        targetType: raw.targetType,
        targetId: raw.targetId,
        serverId: raw.serverId,
        reason: raw.reason,
        metadata: raw.metadata as Record<string, any>,
        ipAddress: raw.ipAddress,
        userAgent: raw.userAgent,
        createdAt: raw.createdAt,
      },
      raw.id,
    );

    return result.getValue();
  }

  async findWithDetails(filter: AuditLogFilter): Promise<{ logs: SecurityAuditLogWithActor[]; total: number }> {
    const where: any = {};

    if (filter.serverId) {
      where.serverId = filter.serverId;
    }
    if (filter.actorId) {
      where.actorId = filter.actorId;
    }
    if (filter.targetId) {
      where.targetId = filter.targetId;
    }
    if (filter.action) {
      where.action = filter.action;
    }
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    const [rows, total] = await Promise.all([
      this.prisma.securityAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter.limit ?? 50,
        skip: filter.offset ?? 0,
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          server: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.securityAuditLog.count({ where }),
    ]);

    const targetUserIds = rows
      .filter((r) => r.targetType === 'USER' && r.targetId)
      .map((r) => r.targetId as string);

    let targetUsersMap: Record<string, { id: string; username: string; displayName?: string | null }> = {};
    if (targetUserIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: targetUserIds } },
        select: { id: true, username: true, displayName: true },
      });
      targetUsersMap = users.reduce((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {} as any);
    }

    const logs: SecurityAuditLogWithActor[] = rows.map((r) => ({
      id: r.id,
      action: r.action as AuditLogActionEnum,
      actorId: r.actorId,
      actor: r.actor
        ? {
            id: r.actor.id,
            username: r.actor.username,
            displayName: r.actor.displayName,
            avatarUrl: r.actor.avatarUrl,
          }
        : undefined,
      targetType: r.targetType,
      targetId: r.targetId,
      targetUser: r.targetType === 'USER' && r.targetId ? targetUsersMap[r.targetId] || null : null,
      serverId: r.serverId,
      serverName: r.server?.name || null,
      reason: r.reason,
      metadata: r.metadata as Record<string, any>,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      createdAt: r.createdAt,
    }));

    return { logs, total };
  }
}
