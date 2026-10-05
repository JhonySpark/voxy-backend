import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaModerationRepository } from './prisma-moderation.repository.js';
import { ModerationReport } from '../../../modules/moderation/domain/entities/moderation-report.entity.js';
import {
  ReportTargetTypeEnum,
  ReportReasonEnum,
  ReportStatusEnum,
} from '../../../core/enums/index.js';

describe('PrismaModerationRepository', () => {
  let repo: PrismaModerationRepository;
  let prismaMock: {
    moderationReport: {
      create: ReturnType<typeof vi.fn>;
      findById?: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      moderationReport: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
    };
    repo = new PrismaModerationRepository(prismaMock as any);
  });

  const domainReport = ModerationReport.create({
    reporterId: 'u1',
    targetType: ReportTargetTypeEnum.USER,
    targetUserId: 'u2',
    reason: ReportReasonEnum.CHILD_SAFETY_EXPLOITATION,
    description: 'Relato grave de assédio a menor.',
  }).getValue();

  it('should create moderation report and map to domain entity', async () => {
    prismaMock.moderationReport.create.mockResolvedValue({
      id: domainReport.id,
      reporterId: 'u1',
      targetType: 'USER',
      targetUserId: 'u2',
      targetServerId: null,
      targetChannelId: null,
      reason: 'CHILD_SAFETY_EXPLOITATION',
      description: 'Relato grave de assédio a menor.',
      status: 'PENDING',
      resolutionNotes: null,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await repo.create(domainReport);
    expect(prismaMock.moderationReport.create).toHaveBeenCalled();
    expect(result.id).toBe(domainReport.id);
    expect(result.reason).toBe(ReportReasonEnum.CHILD_SAFETY_EXPLOITATION);
    expect(result.isChildSafety()).toBe(true);
  });

  it('should update moderation report', async () => {
    domainReport.resolve('admin-1', 'Bloqueado preventivamente.');
    prismaMock.moderationReport.update.mockResolvedValue({
      id: domainReport.id,
      reporterId: 'u1',
      targetType: 'USER',
      targetUserId: 'u2',
      targetServerId: null,
      targetChannelId: null,
      reason: 'CHILD_SAFETY_EXPLOITATION',
      description: 'Relato grave de assédio a menor.',
      status: 'RESOLVED',
      resolutionNotes: 'Bloqueado preventivamente.',
      resolvedBy: 'admin-1',
      resolvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updated = await repo.update(domainReport);
    expect(prismaMock.moderationReport.update).toHaveBeenCalled();
    expect(updated.status).toBe(ReportStatusEnum.RESOLVED);
    expect(updated.resolvedBy).toBe('admin-1');
  });

  it('should count pending reports', async () => {
    prismaMock.moderationReport.count.mockResolvedValue(5);
    const count = await repo.countPending();
    expect(count).toBe(5);
  });
});
