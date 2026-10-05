import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  IModerationRepository,
  ModerationReportFilter,
} from '../../../core/ports/repositories/moderation.repository.port.js';
import { ModerationReport } from '../../../modules/moderation/domain/entities/moderation-report.entity.js';
import {
  ReportTargetTypeEnum,
  ReportReasonEnum,
  ReportStatusEnum,
} from '../../../core/enums/index.js';

@Injectable()
export class PrismaModerationRepository implements IModerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(report: ModerationReport): Promise<ModerationReport> {
    const created = await this.prisma.moderationReport.create({
      data: {
        id: report.id,
        reporterId: report.reporterId,
        targetType: report.targetType as any,
        targetUserId: report.targetUserId || null,
        targetServerId: report.targetServerId || null,
        targetChannelId: report.targetChannelId || null,
        reason: report.reason as any,
        description: report.description,
        status: report.status as any,
      },
    });

    return ModerationReport.create(
      {
        reporterId: created.reporterId,
        targetType: created.targetType as ReportTargetTypeEnum,
        targetUserId: created.targetUserId,
        targetServerId: created.targetServerId,
        targetChannelId: created.targetChannelId,
        reason: created.reason as ReportReasonEnum,
        description: created.description,
        status: created.status as ReportStatusEnum,
        resolutionNotes: created.resolutionNotes,
        resolvedBy: created.resolvedBy,
        resolvedAt: created.resolvedAt,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
      created.id,
    ).getValue();
  }

  async findById(id: string): Promise<ModerationReport | null> {
    const found = await this.prisma.moderationReport.findUnique({
      where: { id },
    });
    if (!found) return null;

    return ModerationReport.create(
      {
        reporterId: found.reporterId,
        targetType: found.targetType as ReportTargetTypeEnum,
        targetUserId: found.targetUserId,
        targetServerId: found.targetServerId,
        targetChannelId: found.targetChannelId,
        reason: found.reason as ReportReasonEnum,
        description: found.description,
        status: found.status as ReportStatusEnum,
        resolutionNotes: found.resolutionNotes,
        resolvedBy: found.resolvedBy,
        resolvedAt: found.resolvedAt,
        createdAt: found.createdAt,
        updatedAt: found.updatedAt,
      },
      found.id,
    ).getValue();
  }

  async findAll(filter?: ModerationReportFilter): Promise<any[]> {
    const where: any = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.targetType) where.targetType = filter.targetType;
    if (filter?.targetUserId) where.targetUserId = filter.targetUserId;
    if (filter?.targetServerId) where.targetServerId = filter.targetServerId;

    const reports = await this.prisma.moderationReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        targetUser: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        targetServer: {
          select: { id: true, name: true, iconUrl: true },
        },
      },
    });

    return reports;
  }

  async update(report: ModerationReport): Promise<ModerationReport> {
    const updated = await this.prisma.moderationReport.update({
      where: { id: report.id },
      data: {
        status: report.status as any,
        resolutionNotes: report.resolutionNotes || null,
        resolvedBy: report.resolvedBy || null,
        resolvedAt: report.resolvedAt || null,
      },
    });

    return ModerationReport.create(
      {
        reporterId: updated.reporterId,
        targetType: updated.targetType as ReportTargetTypeEnum,
        targetUserId: updated.targetUserId,
        targetServerId: updated.targetServerId,
        targetChannelId: updated.targetChannelId,
        reason: updated.reason as ReportReasonEnum,
        description: updated.description,
        status: updated.status as ReportStatusEnum,
        resolutionNotes: updated.resolutionNotes,
        resolvedBy: updated.resolvedBy,
        resolvedAt: updated.resolvedAt,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      updated.id,
    ).getValue();
  }

  async countPending(): Promise<number> {
    return this.prisma.moderationReport.count({
      where: { status: 'PENDING' },
    });
  }
}
