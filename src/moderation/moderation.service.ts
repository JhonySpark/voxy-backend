import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import {
  MODERATION_REPOSITORY,
} from '../core/ports/repositories/moderation.repository.port.js';
import type {
  IModerationRepository,
  ModerationReportFilter,
} from '../core/ports/repositories/moderation.repository.port.js';
import { ModerationReport } from '../modules/moderation/domain/entities/moderation-report.entity.js';
import {
  ReportTargetTypeEnum,
  ReportReasonEnum,
  ReportStatusEnum,
  AuditLogActionEnum,
} from '../core/enums/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BetterStackLoggerService } from '../infrastructure/logging/better-stack-logger.service.js';
import { SecurityAuditService } from './security-audit.service.js';

export class CreateReportDto {
  targetType!: ReportTargetTypeEnum;
  targetUserId?: string;
  targetServerId?: string;
  targetChannelId?: string;
  reason!: ReportReasonEnum;
  description!: string;
}

export class ResolveReportDto {
  status!: ReportStatusEnum.RESOLVED | ReportStatusEnum.DISMISSED;
  resolutionNotes?: string;
}

@Injectable()
export class ModerationService {
  constructor(
    @Inject(MODERATION_REPOSITORY)
    private readonly moderationRepo: IModerationRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: SecurityAuditService,
    @Optional() private readonly logger?: BetterStackLoggerService,
  ) {}

  async createReport(reporterId: string, dto: CreateReportDto) {
    // Validar se o denunciante existe e está ativo
    const reporter = await this.prisma.user.findUnique({
      where: { id: reporterId },
      select: { id: true, isSuspended: true },
    });

    if (!reporter) {
      throw new NotFoundException('Usuário denunciante não encontrado.');
    }

    if (reporter.isSuspended) {
      throw new ForbiddenException('Usuários suspensos não podem enviar denúncias.');
    }

    // Validações específicas por alvo
    if (dto.targetType === ReportTargetTypeEnum.USER) {
      if (!dto.targetUserId) {
        throw new BadRequestException('ID do usuário denunciado é obrigatório.');
      }
      if (dto.targetUserId === reporterId) {
        throw new BadRequestException('Você não pode denunciar a si mesmo.');
      }
      const targetUser = await this.prisma.user.findUnique({
        where: { id: dto.targetUserId },
        select: { id: true },
      });
      if (!targetUser) {
        throw new NotFoundException('Usuário denunciado não encontrado.');
      }
    } else if (dto.targetType === ReportTargetTypeEnum.SERVER) {
      if (!dto.targetServerId) {
        throw new BadRequestException('ID do servidor denunciado é obrigatório.');
      }
      const server = await this.prisma.server.findUnique({
        where: { id: dto.targetServerId },
        select: { id: true },
      });
      if (!server) {
        throw new NotFoundException('Servidor denunciado não encontrado.');
      }
    }

    const reportOrError = ModerationReport.create({
      reporterId,
      targetType: dto.targetType,
      targetUserId: dto.targetUserId,
      targetServerId: dto.targetServerId,
      targetChannelId: dto.targetChannelId,
      reason: dto.reason,
      description: dto.description,
    });

    if (reportOrError.isFailure) {
      throw new BadRequestException(reportOrError.error);
    }

    const report = reportOrError.getValue();
    const created = await this.moderationRepo.create(report);

    this.logger?.logBusinessEvent('MODERATION_REPORT_CREATED', {
      reportId: created.id,
      reporterId,
      targetType: dto.targetType,
      reason: dto.reason,
      isChildSafety: created.isChildSafety(),
    });

    await this.auditService.record({
      action: AuditLogActionEnum.REPORT_CREATED,
      actorId: reporterId,
      targetType: dto.targetType,
      targetId: dto.targetUserId || dto.targetServerId || dto.targetChannelId || null,
      serverId: dto.targetServerId || null,
      reason: dto.reason,
      metadata: { description: dto.description, reportId: created.id },
    });

    return {
      id: created.id,
      reporterId: created.reporterId,
      targetType: created.targetType,
      targetUserId: created.targetUserId,
      targetServerId: created.targetServerId,
      targetChannelId: created.targetChannelId,
      reason: created.reason,
      description: created.description,
      status: created.status,
      createdAt: created.createdAt,
      message: 'Denúncia registrada com sucesso. Nossos moderadores analisarão com prioridade imediata.',
    };
  }

  async getReports(filter?: ModerationReportFilter) {
    return this.moderationRepo.findAll(filter);
  }

  async getReportById(id: string) {
    const report = await this.moderationRepo.findById(id);
    if (!report) {
      throw new NotFoundException('Denúncia não encontrada.');
    }
    return report;
  }

  async resolveReport(moderatorId: string, id: string, dto: ResolveReportDto) {
    const report = await this.moderationRepo.findById(id);
    if (!report) {
      throw new NotFoundException('Denúncia não encontrada.');
    }

    if (dto.status === ReportStatusEnum.RESOLVED) {
      const res = report.resolve(moderatorId, dto.resolutionNotes);
      if (res.isFailure) throw new BadRequestException(res.error);
    } else {
      const res = report.dismiss(moderatorId, dto.resolutionNotes);
      if (res.isFailure) throw new BadRequestException(res.error);
    }

    const updated = await this.moderationRepo.update(report);

    this.logger?.logBusinessEvent('MODERATION_REPORT_RESOLVED', {
      reportId: updated.id,
      moderatorId,
      status: updated.status,
    });

    await this.auditService.record({
      action: AuditLogActionEnum.REPORT_RESOLVED,
      actorId: moderatorId,
      targetType: 'REPORT',
      targetId: updated.id,
      serverId: updated.targetServerId || null,
      reason: dto.resolutionNotes || 'Denúncia concluída',
      metadata: { status: updated.status },
    });

    return {
      id: updated.id,
      status: updated.status,
      resolutionNotes: updated.resolutionNotes,
      resolvedBy: updated.resolvedBy,
      resolvedAt: updated.resolvedAt,
    };
  }

  async suspendServer(moderatorId: string, serverId: string, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('O motivo da suspensão é obrigatório.');
    }

    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      select: { id: true, name: true },
    });

    if (!server) {
      throw new NotFoundException('Servidor não encontrado.');
    }

    await this.prisma.server.update({
      where: { id: serverId },
      data: {
        isSuspended: true,
        suspendedReason: reason.trim(),
        suspendedAt: new Date(),
      },
    });

    this.logger?.logBusinessEvent('SERVER_SUSPENDED', {
      serverId,
      serverName: server.name,
      moderatorId,
      reason,
    });

    await this.auditService.record({
      action: AuditLogActionEnum.SERVER_SUSPENDED,
      actorId: moderatorId,
      targetType: 'SERVER',
      targetId: serverId,
      serverId,
      reason,
      metadata: { serverName: server.name },
    });

    return { success: true, message: `Servidor '${server.name}' suspenso com sucesso.` };
  }

  async unsuspendServer(moderatorId: string, serverId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
      select: { id: true, name: true },
    });

    if (!server) {
      throw new NotFoundException('Servidor não encontrado.');
    }

    await this.prisma.server.update({
      where: { id: serverId },
      data: {
        isSuspended: false,
        suspendedReason: null,
        suspendedAt: null,
      },
    });

    this.logger?.logBusinessEvent('SERVER_UNSUSPENDED', {
      serverId,
      moderatorId,
    });

    await this.auditService.record({
      action: AuditLogActionEnum.SERVER_UNSUSPENDED,
      actorId: moderatorId,
      targetType: 'SERVER',
      targetId: serverId,
      serverId,
      reason: 'Revogação de suspensão de servidor',
      metadata: { serverName: server.name },
    });

    return { success: true, message: `Suspensão do servidor '${server.name}' revogada.` };
  }

  async suspendAccount(moderatorId: string, targetUserId: string, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('O motivo da suspensão global é obrigatório.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        isSuspended: true,
        suspendedReason: reason.trim(),
        suspendedAt: new Date(),
      },
    });

    this.logger?.logBusinessEvent('ACCOUNT_SUSPENDED', {
      targetUserId,
      username: user.username,
      moderatorId,
      reason,
    });

    await this.auditService.record({
      action: AuditLogActionEnum.USER_SUSPENDED,
      actorId: moderatorId,
      targetType: 'USER',
      targetId: targetUserId,
      reason,
      metadata: { targetUsername: user.username },
    });

    return { success: true, message: `Conta de @${user.username} suspensa globalmente.` };
  }

  async unsuspendAccount(moderatorId: string, targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        isSuspended: false,
        suspendedReason: null,
        suspendedAt: null,
      },
    });

    this.logger?.logBusinessEvent('ACCOUNT_UNSUSPENDED', {
      targetUserId,
      moderatorId,
    });

    await this.auditService.record({
      action: AuditLogActionEnum.USER_UNSUSPENDED,
      actorId: moderatorId,
      targetType: 'USER',
      targetId: targetUserId,
      reason: 'Revogação de suspensão de conta',
      metadata: { targetUsername: user.username },
    });

    return { success: true, message: `Suspensão global de @${user.username} revogada.` };
  }
}
