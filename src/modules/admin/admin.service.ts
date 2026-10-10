import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ChatGateway } from '../../chat/chat.gateway.js';
import { SystemConfigService } from '../system-config/system-config.service.js';
import { ModerationService } from '../../moderation/moderation.service.js';
import { SecurityAuditService } from '../../moderation/security-audit.service.js';
import { AuditLogActionEnum } from '../../core/enums/index.js';
import {
  UpdateUserDto,
  UpdateSystemConfigDto,
  AdminResolveReportDto,
  QueryUsersDto,
  QueryReportsDto,
} from './dto/admin.dto.js';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly systemConfigService: SystemConfigService,
    private readonly moderationService: ModerationService,
    private readonly securityAuditService: SecurityAuditService,
  ) {}

  /**
   * Estatísticas consolidadas para os Dashboards
   */
  async getDashboardStats() {
    const [
      totalUsers,
      suspendedUsers,
      totalServers,
      pendingReports,
      investigatingReports,
      resolvedReports,
      appStatus,
      usersByAge,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isSuspended: true } }),
      this.prisma.server.count(),
      this.prisma.moderationReport.count({ where: { status: 'PENDING' } }),
      this.prisma.moderationReport.count({ where: { status: 'INVESTIGATING' } }),
      this.prisma.moderationReport.count({ where: { status: 'RESOLVED' } }),
      this.systemConfigService.getAppStatus(),
      this.prisma.user.groupBy({
        by: ['ageClassification'],
        _count: { id: true },
      }),
    ]);

    // Métricas dinâmicas em tempo real (Gateway WebSockets e Voz)
    const onlineUsers = this.chatGateway.getOnlineUsersCount();
    const voiceUsers = this.chatGateway.getVoiceUsersCount();

    // Novos cadastros dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentUsers = await this.prisma.user.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    });

    // Mapear contagem por dia (formato YYYY-MM-DD)
    const dailyRegistrationsMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyRegistrationsMap[key] = 0;
    }

    recentUsers.forEach((u) => {
      const day = u.createdAt.toISOString().split('T')[0];
      if (dailyRegistrationsMap[day] !== undefined) {
        dailyRegistrationsMap[day]++;
      }
    });

    const registrationHistory = Object.entries(dailyRegistrationsMap).map(
      ([date, count]) => ({ date, count }),
    );

    const ageDemographics: Record<string, number> = {
      UNKNOWN: 0,
      CHILD: 0,
      TEEN: 0,
      ADULT: 0,
    };
    usersByAge.forEach((item) => {
      ageDemographics[item.ageClassification] = item._count.id;
    });

    return {
      onlineUsers,
      voiceUsers,
      totalUsers,
      suspendedUsers,
      totalServers,
      pendingReports,
      investigatingReports,
      resolvedReports,
      appStatus,
      ageDemographics,
      registrationHistory,
    };
  }

  /**
   * Listagem paginada e com busca de usuários
   */
  async getUsers(query: QueryUsersDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search && query.search.trim()) {
      const search = query.search.trim();
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.isSuspended !== undefined && query.isSuspended !== '') {
      where.isSuspended = query.isSuspended === 'true';
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          isEmailVerified: true,
          isSuspended: true,
          suspendedReason: true,
          suspendedAt: true,
          ageClassification: true,
          ageSignalSource: true,
          createdAt: true,
          _count: {
            select: {
              ownedServers: true,
              serverMemberships: true,
              reportsReceived: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const onlineSet = new Set(this.chatGateway.getOnlineUserIds());

    const enrichedUsers = users.map((u) => ({
      ...u,
      isOnline: onlineSet.has(u.id),
    }));

    return {
      users: enrichedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Atualização de cargo e status de suspensão de usuário
   */
  async updateUser(userId: string, adminId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const dataToUpdate: any = {};

    if (dto.role) {
      dataToUpdate.role = dto.role;
    }

    if (dto.isSuspended !== undefined) {
      dataToUpdate.isSuspended = dto.isSuspended;
      dataToUpdate.suspendedReason = dto.isSuspended ? (dto.suspendedReason || 'Suspenso pela administração') : null;
      dataToUpdate.suspendedAt = dto.isSuspended ? new Date() : null;

      await this.securityAuditService.record({
        action: dto.isSuspended
          ? AuditLogActionEnum.USER_SUSPENDED
          : AuditLogActionEnum.USER_UNSUSPENDED,
        actorId: adminId,
        targetType: 'USER',
        targetId: userId,
        reason: dto.suspendedReason || 'Ação administrativa',
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isSuspended: true,
        suspendedReason: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /**
   * Listagem de denúncias para a moderação
   */
  async getReports(query: QueryReportsDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.targetType) where.targetType = query.targetType;
    if (query.reason) where.reason = query.reason;

    const [reports, total] = await Promise.all([
      this.prisma.moderationReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: { id: true, username: true, email: true, avatarUrl: true },
          },
          targetUser: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
              isSuspended: true,
              ageClassification: true,
            },
          },
          targetServer: {
            select: { id: true, name: true, inviteCode: true, isSuspended: true },
          },
        },
      }),
      this.prisma.moderationReport.count({ where }),
    ]);

    return {
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Resolver ou dispensar denúncia
   */
  async resolveReport(reportId: string, adminId: string, dto: AdminResolveReportDto) {
    const report = await this.prisma.moderationReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Denúncia não encontrada.');
    }

    // Se solicitado suspensão do alvo
    if (dto.suspendTarget) {
      if (report.targetType === 'USER' && report.targetUserId) {
        await this.moderationService.suspendAccount(
          adminId,
          report.targetUserId,
          dto.suspensionReason || `Suspensão decorrente da denúncia #${report.id}: ${dto.resolutionNotes || ''}`,
        );
      } else if (report.targetType === 'SERVER' && report.targetServerId) {
        await this.moderationService.suspendServer(
          adminId,
          report.targetServerId,
          dto.suspensionReason || `Suspensão decorrente da denúncia #${report.id}: ${dto.resolutionNotes || ''}`,
        );
      }
    }

    return this.moderationService.resolveReport(adminId, reportId, {
      status: dto.status as any,
      resolutionNotes: dto.resolutionNotes,
    });
  }

  /**
   * Listagem de Servidores
   */
  async getServers(search?: string, pageStr?: string, limitStr?: string) {
    const page = Math.max(1, parseInt(pageStr || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(limitStr || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search && search.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    const [servers, total] = await Promise.all([
      this.prisma.server.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, username: true, email: true },
          },
          _count: {
            select: { members: true, channels: true, reports: true },
          },
        },
      }),
      this.prisma.server.count({ where }),
    ]);

    return {
      servers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Gerenciamento de Servidores
   */
  async suspendServer(serverId: string, adminId: string, reason: string) {
    return this.moderationService.suspendServer(adminId, serverId, reason);
  }

  async unsuspendServer(serverId: string, adminId: string) {
    return this.moderationService.unsuspendServer(adminId, serverId);
  }

  /**
   * Configurações Globais do Sistema
   */
  async getSystemConfig() {
    return this.systemConfigService.getConfig();
  }

  async updateSystemConfig(dto: UpdateSystemConfigDto) {
    return this.systemConfigService.updateConfig(dto);
  }

  /**
   * Auditoria de Segurança
   */
  async getAuditLogs(adminId: string, query: any) {
    return this.securityAuditService.getGlobalAuditLogs(adminId, {
      action: query.action,
      actorId: query.actorId,
      serverId: query.serverId,
      targetId: query.targetId,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
    });
  }
}
